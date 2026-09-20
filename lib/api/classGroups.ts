import { z } from "zod";
import { apiFetch } from "./client";
import { classGroupSchema, studentSchema, type ClassGroup, type Student } from "./dto/classGroupSchema";

/** Turmas e listas de chamada (E5.1). Somente leitura. */
export const ClassGroupsApi = {
  async list(): Promise<ClassGroup[]> {
    return z.array(classGroupSchema).parse(await apiFetch<unknown>("/class-groups"));
  },

  async students(classGroupId: number): Promise<Student[]> {
    return z.array(studentSchema).parse(await apiFetch<unknown>(`/class-groups/${classGroupId}/students`));
  },
};
