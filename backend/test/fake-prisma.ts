/**
 * Prisma falso en memoria para pruebas de servicios.
 *
 * Soporta el subconjunto que usa la app: findMany/findFirst/findUnique/count/aggregate/groupBy
 * con filtros where (igualdad, in, not, gte/lte, OR). Las relaciones (product, partner…) se
 * resuelven al leer a partir de los *Id, así que los servicios pueden usar include/select.
 * Las pruebas verifican resultados, no la forma de las consultas: siguen siendo válidas si
 * se optimiza cómo se consulta.
 */

type Row = Record<string, any>;

export interface Datos {
  user?: Row[];
  product?: Row[];
  purchase?: Row[];
  delivery?: Row[];
  sale?: Row[];
  transfer?: Row[];
  stockReturn?: Row[];
  commissionPayment?: Row[];
}

const MODELOS = ['user', 'product', 'purchase', 'delivery', 'sale', 'transfer', 'stockReturn', 'commissionPayment'] as const;

function cumple(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([campo, cond]) => {
    if (campo === 'OR') return (cond as Row[]).some((w) => cumple(row, w));
    if (campo === 'AND') return (cond as Row[]).every((w) => cumple(row, w));
    const valor = row[campo];
    if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('in' in cond && !cond.in.includes(valor)) return false;
      if ('not' in cond && valor === cond.not) return false;
      if ('equals' in cond && valor !== cond.equals) return false;
      if ('gte' in cond && !(valor >= cond.gte)) return false;
      if ('lte' in cond && !(valor <= cond.lte)) return false;
      if ('gt' in cond && !(valor > cond.gt)) return false;
      if ('lt' in cond && !(valor < cond.lt)) return false;
      return true;
    }
    return valor === cond;
  });
}

function sumar(rows: Row[], campos: Row = {}) {
  const _sum: Row = {};
  for (const campo of Object.keys(campos)) {
    _sum[campo] = rows.length ? rows.reduce((acc, r) => acc + (r[campo] ?? 0), 0) : null;
  }
  return _sum;
}

function ordenar(rows: Row[], orderBy?: Row | Row[]) {
  if (!orderBy) return rows;
  const reglas = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const regla of reglas) {
      const [campo, dir] = Object.entries(regla)[0];
      if (a[campo] < b[campo]) return dir === 'asc' ? -1 : 1;
      if (a[campo] > b[campo]) return dir === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

export function crearFakePrisma(datos: Datos) {
  const tablas: Record<string, Row[]> = {};
  for (const m of MODELOS) tablas[m] = (datos[m] ?? []).map((r) => ({ ...r }));

  const porId = (modelo: string, id: string) => tablas[modelo].find((r) => r.id === id);

  // Resuelve relaciones a partir de los campos *Id
  const conRelaciones = (row: Row): Row => ({
    ...row,
    ...(row.productId && { product: porId('product', row.productId) }),
    ...(row.partnerId && { partner: porId('user', row.partnerId) }),
    ...(row.fromPartnerId && { fromPartner: porId('user', row.fromPartnerId) }),
    ...(row.toPartnerId && { toPartner: porId('user', row.toPartnerId) }),
  });

  const delegado = (modelo: string) => {
    const filtrar = (where?: Row) => tablas[modelo].filter((r) => cumple(r, where));
    return {
      findMany: async ({ where, orderBy, skip = 0, take }: Row = {}) => {
        const rows = ordenar(filtrar(where), orderBy).slice(skip, take !== undefined ? skip + take : undefined);
        return rows.map(conRelaciones);
      },
      findFirst: async ({ where }: Row = {}) => {
        const row = filtrar(where)[0];
        return row ? conRelaciones(row) : null;
      },
      findUnique: async ({ where }: Row = {}) => {
        const row = filtrar(where)[0];
        return row ? conRelaciones(row) : null;
      },
      count: async ({ where }: Row = {}) => filtrar(where).length,
      aggregate: async ({ where, _sum }: Row = {}) => ({ _sum: sumar(filtrar(where), _sum) }),
      groupBy: async ({ by, where, _sum, _min }: Row) => {
        const grupos = new Map<string, Row[]>();
        for (const r of filtrar(where)) {
          const clave = JSON.stringify(by.map((c: string) => r[c]));
          grupos.set(clave, [...(grupos.get(clave) ?? []), r]);
        }
        return [...grupos.values()].map((rows) => {
          const g: Row = Object.fromEntries(by.map((c: string) => [c, rows[0][c]]));
          if (_sum) g._sum = sumar(rows, _sum);
          if (_min) {
            g._min = Object.fromEntries(
              Object.keys(_min).map((c) => [c, rows.reduce((m, r) => (r[c] < m ? r[c] : m), rows[0][c])]),
            );
          }
          return g;
        });
      },
      create: async ({ data }: Row) => {
        const row = { id: `${modelo}-${tablas[modelo].length + 1}`, createdAt: new Date(), ...data };
        tablas[modelo].push(row);
        return conRelaciones(row);
      },
      update: async ({ where, data }: Row) => {
        const row = filtrar(where)[0];
        Object.assign(row, data);
        return conRelaciones(row);
      },
      delete: async ({ where }: Row) => {
        const row = filtrar(where)[0];
        tablas[modelo] = tablas[modelo].filter((r) => r !== row);
        return row;
      },
    };
  };

  return Object.fromEntries(MODELOS.map((m) => [m, delegado(m)])) as any;
}
