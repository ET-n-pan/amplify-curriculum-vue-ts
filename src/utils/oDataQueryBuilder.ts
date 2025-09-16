export type ODataValue = string | number | boolean | Date;

export interface ODataQueryParams {
  filter?: string;
  orderby?: string;
  top?: number;
  skip?: number;
  select?: string;
  search?: string;
  count?: boolean;
}

export class ODataQueryBuilder {
  
  // Build filter expressions
  static filter = {
    eq: (field: string, value: ODataValue): string => `${field}%20eq%20'${value}'`,
    ne: (field: string, value: ODataValue): string => `${field}%20ne%20'${value}'`,
    gt: (field: string, value: number | string): string => `${field}%20gt%20${value}`,
    ge: (field: string, value: number | string): string => `${field}%20ge%20${value}`,
    lt: (field: string, value: number | string): string => `${field}%20lt%20${value}`,
    le: (field: string, value: number | string): string => `${field}%20le%20${value}`,
    contains: (field: string, value: string): string => `contains(${field},'${value}')`,
    startsWith: (field: string, value: string): string => `startswith(${field},'${value}')`,
    endsWith: (field: string, value: string): string => `endswith(${field},'${value}')`,
    and: (...conditions: string[]): string => conditions.join('%20and%20'),
    or: (...conditions: string[]): string => conditions.join('%20or%20'),
    in: (field: string, values: string[]): string => `${field}%20in%20('${values.join("','")}')`,
  };
  
  // Build orderby expressions  
  static orderBy = {
    asc: (field: string): string => `${field}%20asc`,
    desc: (field: string): string => `${field}%20desc`,
    multiple: (...fields: string[]): string => fields.join(','),
  };
  
  // Build select expressions
  static select = {
    fields: (...fields: string[]): string => fields.join(','),
  };
}