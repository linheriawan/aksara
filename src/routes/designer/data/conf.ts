export interface DataSource{
    name: string;
    type: 'mysql' | 'rest' | 'filesystem';
    config:FS_DBconf|FS_APIconf|FS_DSconf;
    createdAt?: string;
    updatedAt?: string;
};
export interface FS_DSconf{
    basePath: string;
    format: string;
};
export interface FS_APIconf{
    baseUrl: string;
    authentication: string;
    apiKey: string;
};
export interface FS_DBconf{
    server: string;
    port: string;
    username: string;
    password: string;
    database: string;
};
export interface Field{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    required: boolean;
    mapping: string;
};
export interface ObjectDef{
    name: string;
    source: string;
    primaryKey: string;
    dataSource: string;
    fields: Field[];
    createdAt?: string;
    updatedAt?: string;
};

export const STEPS=[
    {id:1,name:"Data Source"},
    {id:2,name:"Mapping"}
];
