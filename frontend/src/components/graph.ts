// import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
// declare const Chart: any;
import Chart from 'chart.js/auto';

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
      console.log("no donut");
      return ;
    }

    // 3. Crear gráfico tipo donut
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: " ",
            data: data.values,
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)"
            ],
            borderColor: ["#fff"],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        cutout: "70%", // Esto hace que sea donut
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#fff",
              font: {
                size: 14
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

//loadChart();
