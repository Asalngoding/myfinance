import { createClient } from "@/lib/supabase/server";

export async function getDashboard(
  month: string
) {
  const supabase = await createClient();

  const startDate =
    `${month}-01T00:00:00`;

  const nextMonthDate = new Date(
    `${month}-01T00:00:00`
  );

  nextMonthDate.setMonth(
    nextMonthDate.getMonth() + 1
  );

  const nextMonth =
    `${nextMonthDate.getFullYear()}-${String(
      nextMonthDate.getMonth() + 1
    ).padStart(2, "0")}-01T00:00:00`;

  const {
    data: {
      user
    }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      income: 0,
      expense: 0,
      savingsIn: 0,
      savingsOut: 0,
      netCashFlow: 0,
      available: 0,
      expenseRatio: 0,
      transactions: []
    };
  }

  const {
    data: transactions,
    error
  } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .gte(
      "transaction_date",
      startDate
    )
    .lt(
      "transaction_date",
      nextMonth
    )
    .order("transaction_date", {
      ascending: false
    });

  if (error) {
    throw new Error(
      "Gagal mengambil transaksi: " +
        error.message
    );
  }

  const rows = transactions ?? [];

  let income = 0;
  let expense = 0;
  let savingsIn = 0;
  let savingsOut = 0;

  for (const transaction of rows) {
    const amount =
      Number(transaction.amount);

    const type =
      transaction.transaction_type;

    const category =
      transaction.category;

    /*
     * UANG MASUK
     *
     * Semua INCOME menambah
     * pemasukan.
     */
    if (type === "INCOME") {
      income += amount;
      continue;
    }

    /*
     * UANG KELUAR
     *
     * Semua EXPENSE mengurangi
     * uang tersedia.
     */
    if (type === "EXPENSE") {
      expense += amount;
      continue;
    }

    /*
     * TABUNGAN
     *
     * TABUNGAN_MASUK:
     * uang dipindahkan dari saldo
     * tersedia ke tabungan.
     *
     * TABUNGAN_KELUAR:
     * uang dipindahkan dari tabungan
     * kembali ke saldo tersedia.
     */
    if (
      type === "TRANSFER" &&
      category === "TABUNGAN_MASUK"
    ) {
      savingsIn += amount;
      continue;
    }

    if (
      type === "TRANSFER" &&
      category === "TABUNGAN_KELUAR"
    ) {
      savingsOut += amount;
      continue;
    }
  }

  /*
   * Saldo tersedia:
   *
   * Uang Masuk
   * - Uang Keluar
   * - Menabung
   * + Ambil Tabungan
   */
  const available =
    income -
    expense -
    savingsIn +
    savingsOut;

  /*
   * Net Cash Flow juga memperhitungkan
   * perpindahan uang ke/dari tabungan.
   */
  const netCashFlow =
    available;

  const expenseRatio =
    income > 0
      ? (expense / income) * 100
      : 0;

  return {
    income,
    expense,
    savingsIn,
    savingsOut,
    netCashFlow,
    available,
    expenseRatio,
    transactions: rows
  };
}
