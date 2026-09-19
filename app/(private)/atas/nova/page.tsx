import PageHeader from "../../../components/page-header";
import RecordForm from "../../../components/record-form";

export default function NovaAtaPage() {
  return (
    <>
      <PageHeader
        title="Nova Ata"
        subtitle="A ata nasce em rascunho com a lista de chamada da turma; as notas são lançadas no quadro."
        backHref="/atas"
      />
      <div className="p-6">
        <div className="mx-auto max-w-3xl">
          <RecordForm />
        </div>
      </div>
    </>
  );
}
