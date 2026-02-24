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

export async function fetchBlockTree(
  client: NotionClient,
  rootId: string,
  pageSize: number = 100
): Promise<BlockTree> {
  const childrenById: Record<string, Block[]> = {};
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await fetchBlockChildrenAll(client, currentId, pageSize);
    childrenById[currentId] = children;

    for (const child of children) {
      if (child.has_children) {
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
