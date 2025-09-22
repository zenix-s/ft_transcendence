// import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
// declare const Chart: any;
import Chart from 'chart.js/auto';
import ChartDataLabels from "chartjs-plugin-datalabels";
import { t } from "@/app/i18n";

// Registrar componentes necesarios
//Chart.register(ArcElement, Tooltip, Legend);

interface ChartData {
  labels: string[];
  values: number[];
}

export async function loadChart() {
  try {
    // 1. Cargar JSON dinámicamente
    const response = await fetch("/data_test.json");
    const data: ChartData = await response.json();

    // 2. Obtener el canvas
    const ctx = document.getElementById("donutChart") as HTMLCanvasElement;
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
            // "rgba(255, 159, 64, 0.6)",
            // "rgba(153, 102, 255, 0.6)",
            // "rgba(75, 192, 192, 0.6)",
          ],
          border: "#131313",
          legendText: "#fff", // Win, Lose
          dataLabel: "#fff" // Text inside doughnut
        }
      : { // Light Mode
          background: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            // "rgba(255, 99, 132, 0.6)",
            // "rgba(54, 162, 235, 0.6)",
            // "rgba(255, 206, 86, 0.6)"
          ],
          border: "#fff",
          legendText: "#131313", // Win, Lose
          dataLabel: "#131313" // Text inside doughnut
        };

    // 5. Destruir gráfico previo si existe (para recargar dinámicamente)
    if (Chart.getChart(ctx)) {
      Chart.getChart(ctx)?.destroy();
    }

    // 6. Crear gráfico tipo donut
    new Chart(ctx, {
      type: "doughnut",
      data: {
        //labels: data.labels,
        labels: [t("win"), t("lose")],
        datasets: [
          {
            label: " ",
            data: data.values,
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 2,
            cutout: "70%" as any
          } as any
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: colors.legendText,
              font: {
                size: 18
              }
            }
          },
          tooltip: {
            enabled: false // Desactiva tooltip porque los datos son visibles
          },
          datalabels: {
            color: colors.dataLabel,
            font: {
              weight: "bold",
              size: 18
            },
            formatter: (value: number) => value, // Muestra el valor directamente
          }
        }
      },
      plugins: [ChartDataLabels] // 👈 Registramos el plugin aquí
    });
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}