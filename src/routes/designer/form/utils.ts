export type FormElement = {
  _id?: string;
  type: string;
  props: Record<string, any>;
  nesting?: FormElement[];
};
export type Schema = FormElement[];
export type DraggedItem = {
  isNew: boolean;
  path?: number[];
  type: FormElement['type'];
  inputType?: string;
  element?: FormElement;
} | null;
export type DropZone = {
  path: number[];
  position: 'before' | 'after' | 'inside';
} | null;