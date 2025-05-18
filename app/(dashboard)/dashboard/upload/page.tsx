"use client";

import { AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Progress } from "@/components/ui/progress";
import { UploadResponse } from "@/lib/types";

import type React from "react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: boolean;
    message?: string;
    count?: number;
  }>({});
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setUploadStatus({});
      } else {
        setFile(null);
        setUploadStatus({
          success: false,
          message: "Por favor, seleccione un archivo CSV válido.",
        });
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setUploadStatus({
        success: false,
        message: "Por favor, seleccione un archivo CSV para subir.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({});
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as UploadResponse;

      if (!response.ok) {
        throw new Error(result.message || "Error al subir el archivo");
      }

      setUploadStatus({
        success: true,
        message: "Archivo recibido. Procesando registros...",
      });

      if (result.fileId) {
        // Comienza a escuchar los eventos de progreso
        const es = new EventSource(`/api/upload/sse?fileId=${result.fileId}`);
        setEventSource(es);

        es.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setProgress(data.progress);
          setProcessedCount(data.processedCount);
          setTotalCount(data.totalCount);

          if (data.progress === 100) {
            es.close();
            setEventSource(null);

            setUploadStatus({
              success: true,
              message: "Procesamiento completado con éxito",
              count: data.processedCount,
            });

            // Redirige al dashboard a los 2 segundos de completar el procesamiento
            setTimeout(() => {
              router.push("/dashboard");
            }, 2000);
          }
        };

        es.onerror = () => {
          es.close();
          setEventSource(null);
          setUploadStatus({
            success: false,
            message: "Error en la conexión de seguimiento de progreso",
          });
          setIsUploading(false);
        };
      }
    } catch (error) {
      setUploadStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al subir el archivo. Por favor, intente nuevamente.",
      });
      setIsUploading(false);
    }
  };

  // Borro el eventSource cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Subir Datos CSV</h1>

      <Card>
        <CardHeader>
          <CardTitle>Subir archivo CSV de FreeStyle Libre</CardTitle>
          <CardDescription>
            Suba un archivo CSV exportado desde LibreView para analizar sus datos de glucosa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-file">Archivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">
                Formatos aceptados: CSV exportado desde LibreView
              </p>
            </div>

            {uploadStatus.message && (
              <Alert variant={uploadStatus.success ? "default" : "destructive"}>
                {uploadStatus.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{uploadStatus.success ? "Éxito" : "Error"}</AlertTitle>
                <AlertDescription>
                  {uploadStatus.message}
                  {uploadStatus.count && (
                    <span className="block mt-1 font-medium">
                      Se han procesado {uploadStatus.count} registros de glucosa.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {isUploading && progress > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Procesando registros...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {totalCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Procesados {processedCount} de {totalCount} registros
                  </p>
                )}
                <Alert className="mt-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-700 dark:text-amber-400">Importante</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    No salga de esta página mientras se procesa el archivo. Si lo hace, el proceso podría interrumpirse.
                    Si necesita continuar más tarde, puede volver a esta página y cargar el mismo archivo para reanudar el procesamiento.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Button type="submit" disabled={!file || isUploading} className="w-full sm:w-auto">
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader size="sm" />
                  <span>Subiendo...</span>
                </div>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  Subir archivo
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          <h3 className="text-sm font-medium">Instrucciones:</h3>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>Exporte sus datos desde LibreView en formato CSV</li>
            <li>Seleccione el archivo exportado usando el botón de arriba</li>
            <li>{`Haga clic en "Subir archivo" para procesar sus datos`}</li>
            <li>Una vez procesado, podrá ver el análisis en el dashboard</li>
          </ol>
        </CardFooter>
      </Card>
    </div>
  );
}
