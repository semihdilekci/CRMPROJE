# AI Chat Context Veri Planı

Bu doküman, AI chatbot'a gönderilen verilerin genişletilmesi için yapılan analiz ve plandır.

---

## 1. İstenen Veriler

| Veri | Kaynak | DB'de Var mı? | Durum |
|------|--------|---------------|-------|
| Customer - company | Customer | ✅ Evet | gatherContextData'ya eklenecek |
| Opportunity - bütçe | Opportunity.budgetRaw, budgetCurrency | ✅ Evet | gatherContextData'ya eklenecek |
| Opportunity - dönüşüm oranı | Opportunity.conversionRate | ✅ Evet | gatherContextData'ya eklenecek |
| Opportunity - kayıp nedeni | Opportunity.lossReason | ✅ Evet | gatherContextData'ya eklenecek |
| Opportunity - seçili ürünler + tonaj | OpportunityProduct (product, quantity, unit) | ✅ Evet | gatherContextData'ya eklenecek |
| Opportunity - aşama bilgisi | Opportunity.currentStage | ✅ Evet | gatherContextData'ya eklenecek |
| Hangi aşamadan ne zaman geçmiş | OpportunityStageLog (stage, createdAt) | ✅ Evet | gatherContextData'ya eklenecek |
| Fırsatı yaratan kişi | — | ⚠️ Türetilebilir | Aşağıda analiz |
| Kişinin takımı | User.team | ✅ Evet | stageLog changedBy üzerinden |

---

## 2. Fırsat Yaratıcısı (createdBy) Analizi

### Mevcut DB Yapısı

- **Opportunity** modelinde `createdById` alanı **yok**.
- **OpportunityStageLog** modelinde `changedById` var — aşamayı değiştiren kişi.
- Fırsat oluşturulduğunda (`opportunity.service.ts` satır 64–69) otomatik olarak ilk stage log eklenir:
  - `stage: 'tanisma'`
  - `changedById: auditUser.id` (fırsatı oluşturan kullanıcı)

### Sonuç: Schema Değişikliği Gerekmez

**Fırsat yaratıcısı = ilk stage log'un `changedBy` bilgisi.**

- Fırsat oluşturulduğunda her zaman ilk log "tanisma" ile eklenir.
- Bu log'un `changedById` değeri fırsatı oluşturan kullanıcıdır.
- `stageLogs` kronolojik sıralandığında (createdAt asc) ilk kayıt = yaratıcı.

### Uygulama

`gatherContextData` içinde her fırsat için:

- `stageLogs` include edilir, `changedBy` ile birlikte.
- `changedBy` için `team: { select: { name: true } }` eklenir.
- İlk stage log'un `changedBy` → fırsat yaratıcısı.
- `changedBy.team?.name` → yaratıcının takımı.

---

## 3. Gelecekte Yapılabilecek İyileştirme (Opsiyonel)

İleride `Opportunity.createdById` eklenirse:

- Fırsat oluşturulurken `createdById: auditUser.id` set edilir.
- Yaratıcı bilgisi stage log'a bağımlı olmaktan çıkar.
- Mevcut veriler için migration: ilk stage log'un changedById değeri createdById'ye kopyalanabilir.

Bu değişiklik şu an **zorunlu değil**; mevcut yapı yeterli.

---

## 4. gatherContextData Yeni Yapı

Gönderilecek veri yapısı:

```typescript
{
  fairs: [...],           // mevcut (id, name, startDate, endDate, opportunityCount)
  opportunities: [        // YENİ: detaylı liste
    {
      id, fairId, fairName,
      customer: { company, name },
      budgetRaw, budgetCurrency, conversionRate, lossReason,
      currentStage, products: string[],
      opportunityProducts: [{ productName, quantity, unit }],
      stageLogs: [{ stage, createdAt, note, lossReason, changedBy: { name, teamName } }],
      creator: { name, teamName }  // ilk stageLog.changedBy
    }
  ],
  stageLogSummary: {...}, // mevcut (genel aşama sayıları)
  customerSummary: {...}  // mevcut (total, byProduct)
}
```

---

## 5. Aksiyon Özeti

1. ✅ **Plan tamamlandı** — createdBy için schema değişikliği gerekmediği doğrulandı.
2. 🔄 **gatherContextData güncellenecek** — yukarıdaki yapıya göre tüm veriler toplanacak.
