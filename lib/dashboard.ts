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
    data: { user }
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

  /*
   * ==========================================
   * 1. Ambil semua transaksi
   *    untuk menghitung Saldo Tersedia
   * ==========================================
   */
  const {
    data: allTransactions,
    error: allTransactionsError
  } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id);

  if (allTransactionsError) {
    throw new Error(
      "Gagal mengambil seluruh transaksi: " +
        allTransactionsError.message
    );
  }

  /*
   * ==========================================
   * 2. Ambil transaksi bulan berjalan
   *    untuk statistik Dashboard
   * ==========================================
   */
  const {
    data: monthlyTransactions,
    error: monthlyTransactionsError
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

  if (monthlyTransactionsError) {
    throw new Error(
      "Gagal mengambil transaksi bulanan: " +
        monthlyTransactionsError.message
    );
  }

  const allRows =
    allTransactions ?? [];

  const monthlyRows =
    monthlyTransactions ?? [];

  /*
   * ==========================================
   * 3. Hitung saldo tersedia ALL TIME
   *
   * Saldo =
   * seluruh uang masuk
   * - seluruh uang keluar
   * - seluruh uang yang masuk tabungan
   * + seluruh uang yang diambil dari tabungan
   * ==========================================
   */
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavingsIn = 0;
  let totalSavingsOut = 0;

  for (const transaction of allRows) {
    const amount =
      Number(transaction.amount);

    const type =
      transaction.transaction_type;

    const category =
      transaction.category;

    if (type === "INCOME") {
      totalIncome += amount;
      continue;
    }

    if (type === "EXPENSE") {
      totalExpense += amount;
      continue;
    }

    if (
      type === "TRANSFER" &&
      category === "TABUNGAN_MASUK"
    ) {
      totalSavingsIn += amount;
      continue;
    }

    if (
      type === "TRANSFER" &&
      category === "TABUNGAN_KELUAR"
    ) {
      totalSavingsOut += amount;
      continue;
    }
  }

  const available =
    totalIncome -
    totalExpense -
    totalSavingsIn +
    totalSavingsOut;

  /*
   * ==========================================
   * 4. Hitung statistik BULAN BERJALAN
   * ==========================================
   */
  let income = 0;
  let expense = 0;
  let savingsIn = 0;
  let savingsOut = 0;

  for (const transaction of monthlyRows) {
    const amount =
      Number(transaction.amount);

    const type =
      transaction.transaction_type;

    const category =
      transaction.category;

    if (type === "INCOME") {
      income += amount;
      continue;
    }

    if (type === "EXPENSE") {
      expense += amount;
      continue;
    }

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
   * Net Cash Flow bulan berjalan
   */
  const netCashFlow =
    income -
    expense -
    savingsIn +
    savingsOut;

  /*
   * Persentase pengeluaran
   */
  const expenseRatio =
    income > 0
      ? (expense / income) * 100
      : 0;

  return {
    /*
     * Statistik bulan berjalan
     */
    income,
    expense,
    savingsIn,
    savingsOut,
    netCashFlow,

    /*
     * Saldo tersedia seluruh periode
     */
    available,

    /*
     * Persentase pengeluaran
     */
    expenseRatio,

    /*
     * History transaksi bulan berjalan
     */
    transactions: monthlyRows
  };
}
