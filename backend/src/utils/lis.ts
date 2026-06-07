/**
 * Calculates the Longest Increasing Subsequence (LIS) of indices to determine
 * which items are in correct relative order, minimizing YouTube API updates.
 *
 * @param arr Array of numbers representing the positions of video elements.
 * @returns Indices of elements that form the LIS.
 */
export function getLISIndices(arr: number[]): number[] {
  if (arr.length === 0) return [];

  const parent = new Array(arr.length).fill(0);
  const increasingSubseq = [];

  for (let i = 0; i < arr.length; i++) {
    // Binary search for the insertion point of arr[i] in increasingSubseq
    let low = 1;
    let high = increasingSubseq.length;
    while (low <= high) {
      const mid = Math.ceil((low + high) / 2);
      if (arr[increasingSubseq[mid - 1]] < arr[i]) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const pos = low;
    parent[i] = pos > 1 ? increasingSubseq[pos - 2] : -1;

    if (pos > increasingSubseq.length) {
      increasingSubseq.push(i);
    } else {
      increasingSubseq[pos - 1] = i;
    }
  }

  // Reconstruct the LIS indices
  const l = increasingSubseq.length;
  const lis = new Array(l);
  let k = increasingSubseq[l - 1];
  for (let i = l - 1; i >= 0; i--) {
    lis[i] = k;
    k = parent[k];
  }

  return lis;
}
