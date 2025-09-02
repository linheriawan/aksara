// Main data module - exports client-safe functions only
export * from './data-client.js';

// Export types that are needed by both client and server
export type { DataSource, DS_DBConf, DS_APIConf, DS_FSConf, ObjectDef, ObjField } from './data-server.js';