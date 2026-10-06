import { z } from "zod";
import { apiFetch } from "./client";
import {
  classGroupSchema,
  studentSchema,
  type ClassGroup,
  type ClassGroupInput,
  type Student,
  type StudentInput,
} from "./dto/classGroupSchema";

/** Turmas, alunos e matrículas. A escrita é de supervisor, coordenador e admin (a API decide). */
export const ClassGroupsApi = {
  async list(): Promise<ClassGroup[]> {
    return z.array(classGroupSchema).parse(await apiFetch<unknown>("/class-groups"));
  },

  async students(classGroupId: number): Promise<Student[]> {
    return z.array(studentSchema).parse(await apiFetch<unknown>(`/class-groups/${classGroupId}/students`));
  },

  async create(input: ClassGroupInput): Promise<ClassGroup> {
    return classGroupSchema.parse(
      await apiFetch<unknown>("/class-groups", { method: "POST", body: JSON.stringify(input) }),
    );
  },

  async allStudents(): Promise<Student[]> {
    return z.array(studentSchema).parse(await apiFetch<unknown>("/students"));
  },

  async createStudent(input: StudentInput): Promise<Student> {
    return studentSchema.parse(
      await apiFetch<unknown>("/students", { method: "POST", body: JSON.stringify(input) }),
    );
  },

  async enroll(classGroupId: number, studentId: number): Promise<void> {
    await apiFetch<unknown>(`/class-groups/${classGroupId}/students/${studentId}`, { method: "PUT" });
  },

  async unenroll(classGroupId: number, studentId: number): Promise<void> {
    await apiFetch<unknown>(`/class-groups/${classGroupId}/students/${studentId}`, { method: "DELETE" });
  },
};
