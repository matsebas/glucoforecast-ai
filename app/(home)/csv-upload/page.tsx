"use client";

import { AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Progress } from "@/components/ui/progress";
import { UploadResponse } from "@/lib/types";
import { PROCESSING_MESSAGES, UI_LABELS } from "@/lib/constants/messages";

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
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsValidating(false);
    setIsProcessing(false);

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

      setIsUploading(false);

      setUploadStatus({
        success: true,
        message: PROCESSING_MESSAGES.FILE_RECEIVED,
      });

      setIsValidating(true);

      if (result.fileId) {
        // Comienza a escuchar los eventos de progreso
        const es = new EventSource(`/api/upload/sse?fileId=${result.fileId}`);
        setEventSource(es);

        es.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.info(
            `[${new Date().toISOString()}] 🎯 Frontend recibió [${data.type}]: ${data.progress}% (${data.processedCount}/${data.totalCount})`
          );

          // Manejar diferentes tipos de eventos SSE
          switch (data.type) {
            case "ready": {
              console.info("🔗 Conexión SSE establecida");
              break;
            }

            case "validation-started": {
              setIsValidating(true);
              setIsProcessing(false);
              setUploadStatus({
                success: true,
                message: data.message || PROCESSING_MESSAGES.VALIDATION_IN_PROGRESS,
              });
              break;
            }

            case "validation-completed": {
              setIsValidating(false);

              if (data.newRecords === 0) {
                // Si no hay registros nuevos, no habrá procesamiento
                setUploadStatus({
                  success: true,
                  message: data.message,
                });
              } else {
                // Si hay registros nuevos, preparar para procesamiento
                setUploadStatus({
                  success: true,
                  message: data.message,
                });
                setTotalCount(data.newRecords);
              }
              break;
            }

            case "processing": {
              setIsProcessing(true);
              setProgress(data.progress);
              setProcessedCount(data.processedCount);
              setTotalCount(data.totalCount);
              break;
            }

            case "completed": {
              es.close();
              setEventSource(null);
              setIsValidating(false);
              setIsProcessing(false);

              const insertedCount = data.insertedCount ?? 0;
              setUploadStatus({
                success: true,
                message: data.message,
                count: insertedCount,
              });

              // Redirige al dashboard a los 2 segundos de completar el procesamiento
              // setTimeout(() => {
              //   router.push("/dashboard");
              // }, 2000);
              break;
            }

            default: {
              console.warn("Evento SSE desconocido:", data.type, data);
              break;
            }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subir CSV</h1>
        <p className="text-muted-foreground">
          Sube un archivo CSV de LibreView para analizar tus datos de glucosa
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-4">
              <Label htmlFor="csv-file">Archivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                lang="es-419"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground italic">
                Formatos aceptados: CSV exportado desde LibreView
              </p>
            </div>

            {uploadStatus.message && (
              <Alert variant={uploadStatus.success ? "default" : "destructive"}>
                {uploadStatus.success ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <AlertCircle className="size-4" />
                )}
                <AlertTitle>{uploadStatus.success ? UI_LABELS.UPLOAD_SUCCESS : UI_LABELS.UPLOAD_ERROR}</AlertTitle>
                <AlertDescription>
                  {uploadStatus.message}
                  {uploadStatus.count != null && uploadStatus.count > 0 && (
                    <span className="block mt-1 font-medium">
                      {PROCESSING_MESSAGES.RECORDS_PROCESSED(uploadStatus.count)}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Progreso infinito durante validación */}
            {isValidating && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{PROCESSING_MESSAGES.VALIDATION_IN_PROGRESS}</span>
                  <span className="text-muted-foreground">{UI_LABELS.VALIDATION_STATUS}</span>
                </div>
                <Progress isIndeterminate={true} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {PROCESSING_MESSAGES.VALIDATION_DESCRIPTION}
                </p>
              </div>
            )}

            {/* Progreso real durante procesamiento */}
            {isProcessing && progress < 100 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{PROCESSING_MESSAGES.PROCESSING_RECORDS}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {totalCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Procesados {processedCount} de {totalCount} registros
                  </p>
                )}
              </div>
            )}

            {/* Alerta de precaución solo durante procesamiento real */}
            {isProcessing && (
              <Alert className="mt-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="size-4 text-amber-500" />
                <AlertTitle className="text-amber-700 dark:text-amber-400">Importante</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  No salga de esta página mientras se procesa el archivo. Si lo hace, el proceso
                  podría interrumpirse.
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={!file || isUploading} className="w-full sm:w-auto">
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader />
                  <span>Subiendo archivo...</span>
                </div>
              ) : (
                <>
                  <FileUp className="mr-2 size-4" />
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
