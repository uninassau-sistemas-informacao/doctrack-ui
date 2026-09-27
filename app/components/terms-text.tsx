/**
 * Texto de Termos de Uso e Política de Privacidade do DocTrack (E9/U3).
 *
 * Server Component puro — sem estado, sem interação — reaproveitado tanto na página pública
 * `/termos` quanto no bloqueio de aceite obrigatório `/aceite-termos`.
 */
export const TERMS_VERSION_LABEL = "Versão de 27/09/2026";

export default function TermsText() {
  return (
    <div className="flex flex-col gap-5 text-sm text-ink">
      <p className="text-xs text-muted">{TERMS_VERSION_LABEL}</p>

      <section>
        <h3 className="font-semibold">1. Finalidade</h3>
        <p className="mt-1 text-muted">
          O DocTrack é o sistema de tramitação de documentos acadêmicos da instituição — provas,
          atas de avaliação e requerimentos. Ele registra o status, o histórico e o responsável
          por cada etapa desses documentos, do protocolo ao arquivamento.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">2. Dados pessoais tratados</h3>
        <p className="mt-1 text-muted">
          Para operar o fluxo, tratamos: nome e e-mail institucional; papel (professor,
          supervisor, secretaria, coordenador ou admin); registros de acesso, incluindo IP e
          navegador; histórico das ações realizadas sobre os documentos; e, nas atas de
          avaliação, notas e presença dos alunos.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">3. Base legal</h3>
        <p className="mt-1 text-muted">
          O tratamento se baseia na execução de atribuições institucionais da instituição de
          ensino, conforme o art. 7º da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>
      </section>

      <section>
        <h3 className="font-semibold">4. Acesso restrito por papel</h3>
        <p className="mt-1 text-muted">
          Cada usuário só acessa os documentos e as ações compatíveis com o seu papel no fluxo.
          Não há acesso livre a dados de outros setores ou de outros usuários.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">5. Retenção</h3>
        <p className="mt-1 text-muted">
          O histórico de tramitação e os registros de auditoria são <em>append-only</em> — não
          são alterados nem apagados — e permanecem enquanto o documento a que se referem
          existir no sistema.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">6. Direitos do titular</h3>
        <p className="mt-1 text-muted">
          Você pode acessar e corrigir o seu próprio nome a qualquer momento em Perfil. Demais
          pedidos relativos aos seus dados pessoais — como acesso a outros registros ou
          eliminação — devem ser feitos à administração do sistema.
        </p>
      </section>

      <section>
        <h3 className="font-semibold">7. Segurança</h3>
        <p className="mt-1 text-muted">
          Senhas são armazenadas com hash bcrypt, nunca em texto puro. As sessões usam cookies
          HttpOnly e expiram automaticamente por inatividade.
        </p>
      </section>
    </div>
  );
}
