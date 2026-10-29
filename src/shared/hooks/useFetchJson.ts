import { useState, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON de configuração das páginas não tem contrato tipado
type JsonConfig = Record<string, any>;

interface UseFetchJsonReturnType {
  data: JsonConfig | null;
  isLoading: boolean;
}

// Um download por URL na sessão: o layout e a página do mapa leem o mesmo mapa-de-obras.json.
// Falha sai do cache, para a próxima montagem tentar de novo
const downloads = new Map<string, Promise<JsonConfig>>();
const baixarJson = (url: string) => {
  let download = downloads.get(url);
  if (!download) {
    download = fetch(url).then((response) => response.json());
    downloads.set(url, download);
    download.catch(() => downloads.delete(url));
  }
  return download;
};

const useFetchJson = (url: string): UseFetchJsonReturnType => {
  const [data, setData] = useState<JsonConfig | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jsonData = await baixarJson(url);
        setData(jsonData);
      } catch (error) {
        console.error(`Erro ao carregar ${url}`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, isLoading };
};

export default useFetchJson;
