import { Revision, Problem } from '../../types';

export interface DueQueueItem {
  problem: Problem;
  revision: Revision;
  next_due_date: string;
}

/**
 * Min-Heap for Spaced Revision Due Queue.
 * Keyed on (next_due_date, problem_id) with deterministic ascending order.
 */
export class DueQueue {
  private heap: DueQueueItem[] = [];

  public push(item: DueQueueItem): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): DueQueueItem | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return top;
  }

  public peek(): DueQueueItem | undefined {
    return this.heap[0];
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public toArray(): DueQueueItem[] {
    // Clone and pop all to return deterministically sorted array
    const clone = new DueQueue();
    clone.heap = [...this.heap];
    const result: DueQueueItem[] = [];
    while (!clone.isEmpty()) {
      result.push(clone.pop()!);
    }
    return result;
  }

  /**
   * Returns all revisions due on or before "today", ordered ascending by due date.
   */
  public getDueItems(today: string): DueQueueItem[] {
    return this.toArray().filter((item) => item.next_due_date <= today);
  }

  private compare(a: DueQueueItem, b: DueQueueItem): number {
    if (a.next_due_date < b.next_due_date) return -1;
    if (a.next_due_date > b.next_due_date) return 1;
    // Deterministic tie-breaker on problem ID
    if (a.problem.id < b.problem.id) return -1;
    if (a.problem.id > b.problem.id) return 1;
    return 0;
  }

  private bubbleUp(index: number): void {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (this.compare(element, parent) >= 0) break;
      this.heap[index] = parent;
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;

      if (leftChildIndex < length) {
        if (this.compare(this.heap[leftChildIndex], element) < 0) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const compareTarget =
          swapIndex === null ? element : this.heap[leftChildIndex];
        if (this.compare(this.heap[rightChildIndex], compareTarget) < 0) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;
      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = element;
      index = swapIndex;
    }
  }
}

