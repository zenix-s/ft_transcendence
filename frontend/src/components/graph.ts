import Chart from 'chart.js/auto';
import ChartDataLabels from "chartjs-plugin-datalabels";
import { t } from "@/app/i18n";
import { getCurrentUser, getStats } from "@/modules/users";
import type { User } from "@/types/user";
import type { ChartConfiguration, ChartDataset, Plugin } from 'chart.js/auto';

export async function loadChart(user?: User) {
  try {
    // 1. Si no recibo un user se lo solicito a getCurrentUser()
    if (!user) {
      const userResponse = await getCurrentUser();
      if (!userResponse) return;
      user = userResponse.user;
    }

    const currentUser: User = user;
  
    const response = await getStats(currentUser.id);
    if (!response) { return; }

    // 👉 Generar array con wins y losses
    const values = [response.wins, response.losses];

    // 2. Obtener el canvas
    const ctx = document.getElementById("donutChart") as HTMLCanvasElement | null;
    if (!ctx)
    {
      console.log("Canvas 'donutChart' no encontrado.");
      return ;
    }

    // 3. Detectar si está en modo oscuro
    const isDarkMode = document.documentElement.classList.contains("dark");

    // 4. Definir colores dinámicamente según el modo
    const colors = isDarkMode
      ? { // Dark Mode
          background: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
          ],
          border: "#131313",
          legendText: "#fff", // Win, Lose
          dataLabel: "#fff", // Text inside doughnut
          placeholder: "#c3c3c3" // gris claro en dark
        }
      : { // Light Mode
          background: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
          ],
          border: "#fff",
          legendText: "#131313", // Win, Lose
          dataLabel: "#131313", // Text inside doughnut
          placeholder: "#4b5563" // gris oscuro en light
        };

    // 5. Destruir gráfico previo si existe (para recargar dinámicamente)
    if (Chart.getChart(ctx)) {
      Chart.getChart(ctx)?.destroy();
    }

    // 6. Comprobar si ambos valores son 0
    const bothZero = values[0] === 0 && values[1] === 0;

    // Tipos para datasets
    type DoughnutDataset = ChartDataset<"doughnut", number[]>;

    const config: ChartConfiguration<"doughnut", number[], string> = {
      type: "doughnut",
      data: {
        labels: bothZero ? ["Sin datos"] : [t("win"), t("lose")],
        datasets: bothZero
          ? [{
              data: [1],
              backgroundColor: [colors.placeholder],
              borderColor: colors.border,
              borderWidth: 2,
              cutout: "70%" // Chart.js soporta string directamente
            } as DoughnutDataset]
          : [{
              data: values,
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 2,
              cutout: "70%"
            } as DoughnutDataset]
      },
      options: {
        responsive: true,
        plugins: {
          legend: bothZero
            ? { display: false }
            : {
                position: "bottom",
                labels: {
                  color: colors.legendText,
                  font: { size: 18 }
                }
              },
          tooltip: { enabled: false },
          datalabels: bothZero
            ? { display: false }
            : {
                color: colors.dataLabel,
                font: { weight: "bold", size: 18 },
                display: (ctx) => ctx.dataset.data[ctx.dataIndex] !== 0,
                formatter: (value: number) => value
              }
        }
      },
      plugins: bothZero ? [] : [ChartDataLabels as Plugin<"doughnut">]
    };

    // 7. Crear gráfico tipo donut
    new Chart(ctx, config);

  } catch (error) {
    console.error(error);
  }
}
