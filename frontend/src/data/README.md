# Portfolio Skills Data System

Ten plik zawiera logikę przetwarzania danych portfola i generowania dynamicznych statystyk umiejętności.

## Kategorie projektów w MongoDB

W bazie danych MongoDB projekty portfela powinny mieć pole `category` z następującymi możliwymi wartościami:

### **Aplikacje webowe** (Web Applications) - niebieski (rgba(99, 102, 241, 0.8))

```
"web-app", "webapp", "web"
```

### **Aplikacje mobilne** (Mobile Apps) - zielony (rgba(34, 197, 94, 0.8))

```
"mobile-apps", "mobile", "mobilne", "mobile apps", "mob"
```

### **E-commerce** - zielony (rgba(34, 197, 94, 0.8))

```
"ecommerce", "e-commerce", "ekomercyjny", "sklep"
```

### **API i usługi** (APIs & Services) - fioletowy (rgba(139, 92, 246, 0.8))

```
"api", "services", "usługi"
```

### **Narzędzia** (Tools & Utilities) - cyjan (rgba(6, 182, 212, 0.8))

```
"tools", "narzędzia", "utilities"
```

### **Landing page** (Landing Pages) - mięty zielony (rgba(16, 185, 129, 0.8))

```
"landing", "portfolio", "wizytówka"
```

### **Inne** (Other) - pomarańczowy (rgba(245, 158, 11, 0.8))

```
"other", "inne", "" (puste) lub brak pola
```

## Przykład dokumentu w MongoDB

### Prosty przykład (jedna kategoria):

```javascript
{
  "_id": "ObjectId(...)",
  "title": "Sklep z elektroniką",
  "desc": "Nowoczesny sklep ecommerce",
  "tags": ["PHP", "Laravel", "MySQL"],
  "img": "/portfolio/shop.jpg",
  "href": "https://store.example.com",
  "category": "ecommerce",     // ← teraz zamiast "newTech": true
  "dateFrom": "2024-01-15",
  // ... inne pola ...
}
```

### Przykład z wieloma kategoriami (rozdzielonymi przecinkami):

```javascript
{
  "_id": "ObjectId(...)",
  "title": "PWA dla supermarketu",
  "desc": "Aplikacja mobilna i webowa dla klienta B2B",
  "tags": ["React", "Next.js", "PWA", "TypeScript"],
  "img": "/portfolio/pwa-shop.jpg",
  "href": "https://shop.pwa.example.com",
  "category": "web-app, mobile-apps",  // ← wiele kategorii po przecinku!
  "dateFrom": "2024-02-20",
  "dateTo": "2024-06-15",
  // ... inne pola ...
}
```

### Inne przykłady słów kluczowych dla kategorii:

```javascript
"category": "landing"                    // → Landing singiel
"category": "tools, landing"            // → Narzędzia + Landing
"category": "web-app, ecommerce"        // → Webowe + E-commerce
"category": "mobile-apps, web-app"      // → Mobilne + Webowe
```

## Funkcje i ich działanie

### `calculatePortfolioCategories(portfolio)`

- Czyta pole `category` bezpośrednio z dokumentów portfola
- Automatycznie mapuje na polskie nazwy kategorii
- Oblicza procentowe rozłożenie projektów
- Fallback dla brakujących kategorii

### `calculateTechTrends(portfolio)`

- Analizuje trendy technologiczne rok do roku
- Porównuje użycie technologii między kolejnymi latami
- Wyświetla tylko znaczące trendy (+/- 10% zmiana)

### `calculateDynamicSkills(portfolio)`

- Generuje umiejętności na podstawie technologii używanych w projektach
- Określa poziomy umiejętności na podstawie wystąpienia w projektach
- Oblicza miesiące doświadczenia na podstawie zakresów dat

## Zgodność wsteczna

- Jeśli projekt nie ma pola `category` → trafia do kategorii "Inne"
- Obsługa polskich i angielskich nazw kategorii
- Automatyczna normalizacja wielkości liter

## Aktualizacja projektu w bazie danych

By zmienić kategorię istniejącego projektu w MongoDB:

```javascript
// Z legacy newTech
db.portfolio.updateOne(
  { title: 'Nazwa projektu' },
  { $set: { category: 'ecommerce' }, $unset: { newTech: 1 } }
);
```

## Debugowanie

Uruchom przeglądarkę i otwórz konsolę (F12), aby zobaczyć logi:

- `🔍 Portfolio fetch:` - status pobierania danych
- `⚡ Tech trends calculation:` - informacja o trendach
- `📊 Portfolio categories calculation:` - informacja o kategoriach
