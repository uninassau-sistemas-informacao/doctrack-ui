import { z } from "zod";
import { apiFetch } from "./client";
import {
  classGroupSchema,
  studentSchema,
  userOptionSchema,
  type ClassGroup,
  type ClassGroupInput,
  type Student,
  type StudentInput,
  type UserOption,
} from "./dto/classGroupSchema";

/** Turmas, alunos e matrículas. Escrita só do professor dono da turma (a API decide). */
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

  async supervisors(): Promise<UserOption[]> {
    return z.array(userOptionSchema).parse(await apiFetch<unknown>("/class-groups/supervisors"));
  },

  async assignSupervisor(classGroupId: number, supervisorId: number | null): Promise<ClassGroup> {
    return classGroupSchema.parse(
      await apiFetch<unknown>(`/class-groups/${classGroupId}/supervisor`, {
        method: "PUT",
        body: JSON.stringify({ supervisorId }),
      }),
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
