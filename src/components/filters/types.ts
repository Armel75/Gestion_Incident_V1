import type { FilterField, Operator } from "../../constants/incidentFilterColumns";

export type Logic = "AND" | "OR";

export type FilterRowState = {
  id: string;
  field: FilterField;
  op: Operator;
  // value can be: string | number | boolean | string[] | number[] | [string,string]
  value?: any;
};