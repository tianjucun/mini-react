// React Fiber 节点标识位: 无任何操作
export const NoFlags = 0b00000000000000000000000000;

// React Fiber 节点标识位: 插入
export const Placement = 0b00000000000000000000000010;

// React Fiber 节点标识位: 更新
export const Update = 0b00000000000000000000000100;

// React Fiber 节点标识位: 变更标识位掩码
export const MutationMask = Placement | Update;

// React Fiber 节点标识位: 删除
export const ChildDeletion = 0b00000000000000000000001000;

// React Fiber 节点标识位: Effect 相关
export const Passive = 0b00000000000000010000000000;
