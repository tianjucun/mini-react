import isArray from 'shared/array';

/**
 * 向堆中添加一个节点，并维护堆的顺序
 * @param {*} heap
 * @param {*} node
 * @returns
 */
export function push(heap, node) {
  if (!isArray(heap)) {
    return;
  }
  heap.push(node);
  siftUp(heap, heap.length - 1);
}

/**
 * 返回堆顶节点
 * @param {*} heap
 * @returns
 */
export function peek(heap) {
  if (!isArray(heap)) {
    return null;
  }
  return heap.length === 0 ? null : heap[0];
}

/**
 * 弹出对顶节点，并维护堆的顺序
 * @param {*} heap
 * @returns
 */
export function pop(heap) {
  if (!isArray(heap)) {
    return null;
  }

  const firstNode = heap[0];
  const lastNode = heap.pop();
  if (firstNode !== lastNode) {
    heap[0] = lastNode;
    siftDown(heap, 0);
  }
  return firstNode;
}

/**
 * 将堆中 i 位置的数尝试向上移
 * @param {*} heap
 * @param {*} i
 * @returns
 */
export function siftUp(heap, i) {
  if (!Array.isArray(heap)) {
    return;
  }
  if (heap.length === 1 || i > heap.length - 1 || i <= 0) {
    return;
  }

  while (i > 0 && compare(heap[i], heap[(i - 1) >> 1]) > 0) {
    const parent = (i - 1) >> 1;
    swap(heap, i, parent);
    i = parent;
  }
}

function swap(heap, i, j) {
  [heap[i], heap[j]] = [heap[j], heap[i]];
}

/**
 * 将堆中 i 位置的数尝试向下移
 * @param {*} heap
 * @param {*} i
 * @returns
 */
export function siftDown(heap, i) {
  if (!Array.isArray(heap)) {
    return;
  }

  const size = heap.length;
  let l = (i << 1) + 1;
  while (l < size) {
    const best = l + 1 < size && compare(heap[l + 1], heap[l]) > 0 ? l + 1 : l;
    if (heap[i] >= best) {
      break;
    }
    swap(heap, i, best);
    i = best;
    l = (i << 1) + 1;
  }
}

export function compare(a, b) {
  if (!a || !b) {
    console.error('compare a or b is undefined', a, b);
    return -1;
  }
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
