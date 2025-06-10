<script setup lang="ts">
const company="PT Angkasa Pura Logistik";
const app_name="My App Name"
const jurisdiction="'Negara Republik Indonesia'"
const court="'Pengadilan Negri Jakarta Pusat'"
</script>

<div class="grid-1n h-80">
    <div class="flex flex-col justify-center border-b">
        <h1 class="text-center">End User License Agreement </h1>
        <h2 class="text-center">Perjanjian Lisensi Pengguna Akhir </h2>
    </div>
    <div class="h-full overflow-scroll py-4">
        <div class="grid grid-cols-2 mt-2">
            <div> This End User License Agreement ("Agreement") outlines the terms and conditions between you ("User") and {{company}} ("Company") for the use of the {{app_name}} ("Software"). By installing, accessing, or using the Software, you acknowledge your understanding and agreement to comply with the terms set forth in this Agreement. </div>
            <div> Perjanjian Lisensi Pengguna Akhir ("Perjanjian") ini menguraikan dengan cermat dan tegas syarat dan ketentuan yang mengatur hubungan antara Anda ("Pengguna") dan {{ company }} ("Perusahaan") dalam konteks penggunaan {{app_name}} ("Aplikasi"). Dalam menginstal, mengakses, atau menggunakan Aplikasi ini, Anda dengan penuh kesadaran mengakui dan menyetujui sepenuhnya untuk patuh dan tunduk kepada setiap ketentuan yang tercantum dalam Perjanjian ini. </div>
        </div>
        <ol class="list-decimal">
            <li class="grid grid-cols-2">
                <div><h1>User Account and Sharing:</h1> User agrees not to share their account credentials, including usernames and passwords, with any third party. Each account is for individual use and should not be shared, transferred, or accessed by others.</div>
                <div><h1>Akun Pengguna dan Pembagian:</h1> Dalam upaya untuk menjaga integritas dan keamanan, Anda dengan tegas menyetujui bahwa kredensial akun Anda, termasuk nama pengguna dan kata sandi, adalah informasi yang sangat rahasia dan pribadi. Anda dilarang secara tegas membagikan, mengalihkan, atau memungkinkan pihak ketiga lainnya untuk mengakses atau menggunakan kredensial akun tersebut.</div>
            </li>
            <li class="grid grid-cols-2">
                <div><h1>Reverse Engineering:</h1> User shall not engage in any activities that involve reverse engineering, decompiling, disassembling, or attempting to derive the source code of the Software. The Software's intellectual property must be respected and not tampered with.</div>
                <div><h1>Reverse Engineering:</h1> Anda diwajibkan untuk menghormati kekayaan intelektual yang melandasi Aplikasi ini. Oleh karena itu, Anda secara tegas dilarang melakukan, mendukung, atau memfasilitasi aktivitas apa pun yang terkait dengan reverse engineering, decompiling, disassembling, atau usaha apapun untuk mengekspos kode sumber Aplikasi.</div>            
            </li>
            <li class="grid grid-cols-2">
                <div><h1>Information Confidentiality:</h1> User agrees not to share any information, data, or content obtained through the Software with third parties, especially information related to the operation, functionality, or internal workings of the Software.</div>
                <div><h1>Kerahasiaan Informasi:</h1> Kesadaran akan pentingnya menjaga kerahasiaan informasi adalah prioritas utama. Anda setuju sepenuhnya untuk tidak mengungkapkan, membagikan, atau mentransfer informasi yang Anda peroleh melalui penggunaan Aplikasi kepada pihak ketiga tanpa persetujuan tertulis sebelumnya dari Perusahaan.</div>
            </li>
            <li class="grid grid-cols-2">
                <div><h1>Collected Information:</h1> User acknowledges that certain information, including but not limited to the following, will be collected and shared with the owner/manager: NPWP (Nomor Pokok Wajib Pajak), Email Address, Full Name, Address, Company Name</div>
                <div><h1>Informasi yang Dikumpulkan:</h1> Dalam rangka memastikan kelancaran operasional dan efektivitas manajemen, Anda mengakui dan menyetujui bahwa informasi tertentu yang termasuk namun tidak terbatas pada data seperti NPWP (Nomor Pokok Wajib Pajak), alamat email, nama lengkap, alamat, dan nama perusahaan, akan dikumpulkan dan dapat dibagi dengan pemilik atau manajer bandara yang bersangkutan.</div>
            </li>
            <li class="grid grid-cols-2">
                <div><h1>Indemnification:</h1> User agrees to indemnify and hold harmless the Company from any claims, damages, liabilities, or expenses arising out of or related to any violation of this Agreement by the User.</div>
                <div><h1>Pertanggungjawaban:</h1> Anda secara hukum bertanggung jawab penuh atas penggunaan Aplikasi ini. Dalam hal terjadi pelanggaran terhadap ketentuan Perjanjian ini, Anda menyetujui untuk melepaskan dan melindungi Perusahaan dari setiap tuntutan hukum, kerugian, kewajiban, atau biaya yang timbul dari atau terkait dengan pelanggaran tersebut.</div>
            </li>
            <li class="grid grid-cols-2">
                <div><h1>Termination:</h1> Company reserves the right to terminate the User's access to the Software in case of breach of any terms mentioned in this Agreement.</div>
                <div><h1>Penghentian:</h1> Perusahaan dengan tegas mempertahankan hak untuk menghentikan akses Anda ke Aplikasi dalam hal terjadi pelanggaran terhadap syarat dan ketentuan yang tertera dalam Perjanjian ini. Keputusan tersebut akan diambil dengan itikad baik dan berdasarkan pertimbangan yang cermat.</div>
            </li>
            <li class="grid grid-cols-2">
                <div><h1>Governing Law:</h1> This Agreement shall be governed by and interpreted in accordance with the laws of {{jurisdiction}}. Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of the courts in {{ court }}.</div>
                <div><h1>Hukum yang Berlaku:</h1> Dalam hal terjadi sengketa yang timbul dari atau terkait dengan Perjanjian ini, Anda setuju bahwa hukum dan yurisdiksi yang berlaku adalah hukum {{ jurisdiction }}. Semua perselisihan akan diselesaikan di pengadilan {{ court }}.</div>
            </li>
        </ol>
    </div>
</div>
    

<style>
h1{font-weight: bold;color:#333;}
.list-decimal{
    li{margin: 1em 0;}
    h1{font-weight:normal;}
    div{ text-align: justify;padding: 0 .5em; }
}
div.grid > div{text-align: justify; padding: 0 .6em;}
</style>