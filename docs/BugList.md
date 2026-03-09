Burada bilinen bug'ları listeliyorum.

1. Müşteri tahmini bütçesi girilirken tutar girişi hangi sayıya basılırsa bin ekliyor, istediğim sayıyı yazamıyorum.


2. Fuar sayfasında herhangi bir müşterinin kartını genişlettiğimde kart görünümü iki kolon halinde olduğu için yanındaki kolon da genişliyor. Sadece tıklanan kart genişleyecek şekilde ayarlanmalı ve yan kolon sabit kalmalıdır.


3. Fuar yaratırken bitiş tarihi başlangıç tarihinden önce olamamalıdır. Bu şekilde yaratılmak istendiğinde kullanıcıya uyarı verilmelidir. Aynı şekilde başlangıç da bitişten sonra olamaz.


4. müşteri yaratırken mail olarak herhangi bir yazı yazdığımda aşağıdaki hatayı veriyor. mail@mail.com formatında yazdığımda hata vermiyor. Burada mail formatı yanlış yazılırsa hata vermelidir.

## Error Type
Runtime AxiosError

## Error Message
Request failed with status code 400


    at async useUpdateCustomer.useMutation [as mutationFn] (src/hooks/use-customers.ts:54:24)

## Code Frame
  52 |   return useMutation({
  53 |     mutationFn: async ({ id, dto }: { id: string; dto: UpdateCustomerDto }) => {
> 54 |       const { data } = await api.patch<ApiSuccessResponse<Customer>>(`/customers/${id}`, dto);
     |                        ^
  55 |       return data.data;
  56 |     },
  57 |     onSuccess: () => {

Next.js version: 16.1.6 (Turbopack)


5. Fuar yaratırken başlangıç ve bitiş tarihleri boş bırakıldığında hata veriyor. zorunlu alan olmalı ve boşsa kullanıcıya uyarı mesajı çıkartılmalıdır.


