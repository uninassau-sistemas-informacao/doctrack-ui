"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Gráfico de barras dos relatórios (E8.3). Recharts é client-only, então este componente é
 * `"use client"` e a página o importa já dentro do bloco de cliente.
 *
 * `horizontal` serve ao SLA: os rótulos ali são nomes de transição ("Enviar para revisão"),
 * que na vertical viram texto cortado ou girado. Nos outros dois os rótulos são curtos e a
 * barra vertical lê melhor.
 *
 * As cores vêm em hex literal porque Recharts pinta SVG — classe do Tailwind não chega lá.
 * São as mesmas da paleta já usada na aplicação.
 */
const COLORS = ["var(--info)", "var(--success)", "var(--warning)", "var(--violet)", "var(--danger)", "#3B82F6"];

export interface ChartDatum {
  /** Identificador único da barra. Não é o rótulo: prova e ata têm ambas um "Rascunho". */
  key: string;
  label: string;
  value: number;
}

export default function ReportChart({
  data,
  horizontal = false,
  valueSuffix = "",
}: {
  data: ChartDatum[];
  horizontal?: boolean;
  valueSuffix?: string;
}) {
  if (data.length === 0) {
    return null;
  }

  // Altura cresce com a quantidade de barras no modo horizontal: com muitas transições, uma
  // altura fixa espreme as barras até o rótulo sumir.
  const height = horizontal ? Math.max(180, data.length * 38 + 40) : 260;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 16, bottom: 8, left: horizontal ? 8 : 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.07)" vertical={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--neutral)" }} />
              <YAxis
                type="category"
                dataKey="label"
                width={150}
                tick={{ fontSize: 12, fill: "var(--neutral)" }}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--neutral)" }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--neutral)" }} />
            </>
          )}
          <Tooltip
            // O formatter do Recharts 3 entrega `ValueType | undefined`; o número vem
            // convertido em vez de tipado à força, e ausência vira "—" em vez de "undefined h".
            formatter={(value) => [value == null ? "—" : `${Number(value)}${valueSuffix}`, "Total"]}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,.09)", fontSize: 12 }}
          />
          <Bar dataKey="value" radius={4}>
            {data.map((entry, index) => (
              <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
