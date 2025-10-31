# Todo: Stabilizacja CI dla wizytowka (GitHub Actions)

- [x] Zanalizować obecny plik CI (.github/workflows/ci.yml) i potwierdzić strukturę YAML
- [x] Naprawić trailing spaces oraz długie linie zgodnie z wymogami lintów
- [x] Upewnić, że pętla Wait for Postgres & Mongo jest poprawnie zagnieżdżona w kroku skryptu
- [x] Uruchomić yamllint (lokalnie/CI) i potwierdzić wynik
- [ ] Dodać cache zależności dla backend i frontend, aby skrócić czas CI
- [ ] Dodać logowanie artefaktów testów (np. raporty pytest/jest)
- [ ] Dodać raportowanie pokrycia testów (code coverage) w CI
- [ ] Zweryfikować, czy istnieje dodatkowy krok PR do weryfikacji (np. security checks)
- [ ] Wypuścić finalny PR z zatwierdzonymi zmianami i monitorować runy CI

Uwagi:
- Obecny zakres obejmuje głównie stabilność DB i poprawność YAML; dalsze kroki skupią się na wydajności i widoczności wyników testów.
