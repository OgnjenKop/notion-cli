import type { Block } from './types';
import type { NotionClient } from './client';

export interface BlockTree {
  rootId: string;
  blocks: Block[];
  childrenById: Record<string, Block[]>;
}

async function fetchBlockChildrenAll(
  client: NotionClient,
  blockId: string,
  pageSize: number
): Promise<Block[]> {
  const allBlocks: Block[] = [];
  let nextCursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await client.getBlockChildren(blockId, pageSize, nextCursor);
    allBlocks.push(...result.results);
    hasMore = result.has_more;
    nextCursor = result.next_cursor || undefined;
  }

  return allBlocks;
}

/**
 * Fetch all blocks from a page/block with automatic pagination.
 * Uses DFS (stack-based) traversal for O(1) queue operations instead of BFS.
 * This is more efficient for deeply nested block structures.
 * @param client - Notion API client
 * @param rootId - Page or block ID to fetch
 * @param pageSize - Number of blocks per page (default: 100)
 * @returns Object containing blocks array and children-by-id map
 */
export async function fetchBlockTree(
  client: NotionClient,
  rootId: string,
  pageSize: number = 100
): Promise<BlockTree> {
  const childrenById: Record<string, Block[]> = {};
  const queue: string[] = [rootId];

  // Use pop() for O(1) stack operations instead of shift() which is O(n)
  // This changes traversal from BFS to DFS, but correctness is preserved
  // since all blocks are fetched and the childrenById map maintains relationships
  while (queue.length > 0) {
    const currentId = queue.pop()!;
    const children = await fetchBlockChildrenAll(client, currentId, pageSize);
    childrenById[currentId] = children;

    for (const child of children) {
      if (child.has_children && child.id) {
        queue.push(child.id);
      }
    }
  }

  return {
    rootId,
    blocks: childrenById[rootId] || [],
    childrenById,
  };
}
