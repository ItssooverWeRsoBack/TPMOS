/**
 * Vector embeddings utilities for theme clustering.
 *
 * - generateEmbedding: calls Workers AI bge-base-en-v1.5
 * - cosineSimilarity: dot-product similarity for normalized vectors
 * - clusterByEmbedding: agglomerative clustering with a similarity threshold
 */

/**
 * Generate a vector embedding for the given text via Workers AI.
 * Model: @cf/baai/bge-base-en-v1.5 (768-dimensional embeddings).
 */
export async function generateEmbedding(
  ai: unknown,
  text: string
): Promise<number[]> {
  if (!ai) throw new Error("Workers AI binding not available");

  // @ts-expect-error — AI binding is untyped in shared context
  const result = await ai.run("@cf/baai/bge-base-en-v1.5", {
    text: [text],
  });

  // Workers AI returns { shape: [1, 768], data: [[...]] }
  const data = result?.data;
  if (!data || !Array.isArray(data) || data.length === 0) {
    throw new Error("Embedding model returned no data");
  }

  return data[0] as number[];
}

/**
 * Compute cosine similarity between two vectors.
 * Returns a value in [-1, 1] where 1 means identical direction.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;

  return dot / denom;
}

interface ClusterItem {
  id: string;
  embedding: number[];
}

interface Cluster {
  clusterId: number;
  itemIds: string[];
}

/**
 * Agglomerative clustering by cosine similarity.
 *
 * Algorithm:
 * 1. Start with each item in its own cluster.
 * 2. Compute pairwise similarities.
 * 3. Merge the two most-similar clusters if their similarity >= threshold.
 * 4. Repeat until no more merges are possible.
 *
 * Uses average-linkage: similarity between two clusters is the average
 * of all pairwise similarities between their members.
 */
export function clusterByEmbedding(
  items: ClusterItem[],
  threshold: number
): Cluster[] {
  if (items.length === 0) return [];

  // Initialize: each item is its own cluster
  let clusters: { ids: string[]; embeddings: number[][] }[] = items.map(
    (item) => ({
      ids: [item.id],
      embeddings: [item.embedding],
    })
  );

  // Precompute pairwise similarities for efficiency
  const simCache = new Map<string, number>();

  function pairKey(i: number, j: number): string {
    return i < j ? `${i}:${j}` : `${j}:${i}`;
  }

  // Average-linkage similarity between two clusters
  function clusterSimilarity(
    a: { embeddings: number[][] },
    b: { embeddings: number[][] }
  ): number {
    let total = 0;
    let count = 0;

    for (const embA of a.embeddings) {
      for (const embB of b.embeddings) {
        total += cosineSimilarity(embA, embB);
        count++;
      }
    }

    return count > 0 ? total / count : 0;
  }

  // Iteratively merge closest clusters
  while (clusters.length > 1) {
    let bestSim = -Infinity;
    let bestI = -1;
    let bestJ = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const key = pairKey(i, j);
        let sim = simCache.get(key);
        if (sim === undefined) {
          sim = clusterSimilarity(clusters[i], clusters[j]);
          simCache.set(key, sim);
        }
        if (sim > bestSim) {
          bestSim = sim;
          bestI = i;
          bestJ = j;
        }
      }
    }

    // Stop if best similarity is below threshold
    if (bestSim < threshold) break;

    // Merge bestJ into bestI
    clusters[bestI] = {
      ids: [...clusters[bestI].ids, ...clusters[bestJ].ids],
      embeddings: [...clusters[bestI].embeddings, ...clusters[bestJ].embeddings],
    };
    clusters.splice(bestJ, 1);

    // Invalidate cache (indices shifted)
    simCache.clear();
  }

  return clusters.map((c, idx) => ({
    clusterId: idx,
    itemIds: c.ids,
  }));
}
