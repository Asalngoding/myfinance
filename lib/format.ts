export function rupiah(
  value: number | string | null | undefined
) {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
}

export function numberFormat(
  value: number | string | null | undefined
) {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID").format(number);
}

export function dateIndonesia(
  value: string | Date
) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function monthLabel(month: string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(
    new Date(`${month}-01T00:00:00`)
  );
}
