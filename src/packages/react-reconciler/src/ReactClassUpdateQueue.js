export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      // 初始化为 null, 代表待更新项
      // 对应一个循环链表
      pending: null
    }
  }
  fiber.updateQueue = queue;
}