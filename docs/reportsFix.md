Bu dokümanda raporlar özelliği altındaki raporlarda yapılması gereken düzeltmeleri listeliyorum. Düzeltmeler tamamlandıkça agent tarafından mutlaka tamamlandı olarak işaretlenmesi gerekmektedir.

Bu düzeltmeler yapılırken asla var olan diğer özellikler değiştirilmemelidir. Sadece ifade edilen düzeltme için gerekli olan değişiklikler yapılmalıdır.

1. [x] Grafik on hover legend'larda grafiğin 0,1 gibi array değerleri gösteriliyor. Her bir grafikte eğer on hover legend fuar ile alakalıysa fuarın adı, bir müşteri ile alakalı ise müşterinin adı gibi kullanıcının anlayacağı ifadeler kullanılmalıdır. Bu düzenleme on hover legend olan tüm grafiklerde yapılmalıdır. *(Scatter: `ChartTooltip` + `ReportScatterChart` Türkçe eksen etiketleri; scatter formatter’lar sayı/para ayrımı.)*

2. [x] Genel Durum Dashboardunda - Pipeline Aşama Dağılımı grafiği 0: 41 adet, 8: 0 adet olarak göstermektedir. Doğrusu her bir aşama tanışma, toplantı, teklif, sözleşme,satışa dönüştü, olumsuz olarak Y ekseninde sıralanmalıdır. ßX ekseninde ise adetler kolon grafik olarak gösterilmelidir. *(Recharts `layout="horizontal"` dikey kolon; aşama adı yedek haritası + Pipeline Genel Bakış funnel.)*

3. [x] Her bir dashboard'da kazanılan gelir, pipeline değeri vb. farklı kurdan usd,eur,tl, gbp gibi para birimlerinin toplanarak gösterilmesi gerekiyorsa TL cinsine çevrilerek toplanmalıdır. TL çevrimleri db içinde systemSettings altındaki exchange rate'ler üzerinden hesaplanır. Örnek USD=34 ise 1 USD = 34 TL anlamına gelir. 

4. [x] Bubble chart'larda x ve y eksenleri sıfır değerinden başlatılmamalıdır. Grafikte yer alan tüm bubble elementler grafikte görünecek şekilde en küçük değerden %10 daha küçük başlayıp, en büyük değerden %10 daha büyük bitirilmelidir.

5. [x] Fuar genel performans - Fuar Bazlı Dönüşüm Oranı grafiği vertical dikey kolon grafiği olmalı ve her bir fuarın dönüşüm oranı kendi kolonunda gösterilmelidir. *(Recharts `layout="horizontal"` ile dikey kolon.)*
