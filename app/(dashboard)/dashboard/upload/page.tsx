"use client";

import { AlertCircle, CheckCircle2, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

import type React from "react";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

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

    try {
      // In a real application, this would upload the file to your API
      // const formData = new FormData()
      // formData.append("file", file)
      // const response = await fetch("/api/upload", {
      //   method: "POST",
      //   body: formData
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUploadStatus({
        success: true,
        message: "Archivo subido correctamente. Los datos están siendo procesados.",
      });

      // Redirect to dashboard after successful upload
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      setUploadStatus({
        success: false,
        message: "Error al subir el archivo. Por favor, intente nuevamente.",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
                <AlertDescription>{uploadStatus.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={!file || isUploading}>
              {isUploading ? (
                <>Subiendo...</>
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
            <li>Haga clic en "Subir archivo" para procesar sus datos</li>
            <li>Una vez procesado, podrá ver el análisis en el dashboard</li>
          </ol>
        </CardFooter>
      </Card>
    </div>
  );
}
