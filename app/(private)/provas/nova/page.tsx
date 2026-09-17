import ExamForm from "../../../components/exam-form";
import PageHeader from "../../../components/page-header";

export default function NovaProvaPage() {
  return (
    <>
      <PageHeader
        title="Nova Prova"
        subtitle="A prova nasce em rascunho; só a submissão envia para revisão."
        backHref="/provas"
      />
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          <ExamForm />
        </div>
      </div>
    </>
  );
}
