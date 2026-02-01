"use client";

import { Language } from "@regula/shared";
import styled from "styled-components";
import { useEffect, useState } from "react";

const Container = styled.div`
  padding: 2rem;
  font-family: system-ui, sans-serif;
`;

const Title = styled.h1`
  margin-bottom: 1rem;
`;

const Status = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #f0f0f0;
`;

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("checking...");
  const testLanguage: Language = "sv";

  useEffect(() => {
    fetch("http://localhost:3001/health")
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(`API Status: ${data.status || "unknown"}`);
      })
      .catch((err) => {
        setApiStatus(`API Error: ${err.message}`);
      });
  }, []);

  return (
    <Container>
      <Title>Regula</Title>
      <p>Language test: {testLanguage}</p>
      <Status>{apiStatus}</Status>
    </Container>
  );
}
