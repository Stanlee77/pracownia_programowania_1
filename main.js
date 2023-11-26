const axios = require('axios');
const prompt = require('prompt-sync')();
const fs = require('fs');
const pdf = require('pdfkit'); // WYMAGANIA biblioteka pdf: 20%

const tests = [ // WYMAGANIA testy: min 2x pozytywny + 1x negatywny: 30%
    { name: 'Poznan', latitude: 52.4064, longtitude: 16.9252 },
    { name: 'Londyn', latitude: 51.5074, longtitude: 0.1278 },
    { name: 'Tokio', latitude: 35.6762, longtitude: 139.6503 },
    { name: 'Sztokholm (test negatywny)', latitude: 59.3293 }, // negatywny - brak części współrzędnych
    { name: 'Berlin', latitude: 52.5200, longtitude: 13.4050 },
];

const getMessage = (temp, humidity, pressure) => {
    return `Temperatura: ${Math.floor(temp * 10) / 10} st. C, Wilgotnosc: ${humidity}%, Cisnienie: ${pressure}hPa`;
}

async function getWeather(city) {
    let response = await axios
        .get(`https://api.openweathermap.org/data/2.5/weather?lat=${city.latitude}&lon=${city.longtitude}&appid=cedebf5ef208e82ed50735815ce64c77&units=metric`)
        .catch(error => {
            console.log('Nie udało się pobrać danych pogodowych dla miasta: ' + (city.name ?? '(nie podano nazwy miasta)') + ', o współrzędnych: ' + city.latitude + ', ' + city.longtitude + '.');
            console.log('Wiadomość błędu: ', error.message);
            process.exit(-1);
        })

    return response.data;
}

async function main() {
    console.log(`Wybierz opcję (potwierdź ENTER):
    1. Wybierz miasto z listy
    2. Podaj współrzędne lokalizacji
    `);
    const chosenOption = prompt();
    if (chosenOption === '1') {
        tests.forEach((city, index) => console.log(`${index + 1}. ${city.name}`));

        console.log('Wybierz miasto (potwierdź ENTER):');
        const chosenCity = prompt();
        const city = tests[chosenCity - 1];

        const cityJson = JSON.stringify(city); // serializacja JSONa (deserializacją zajmuje się axios - używa JSON.parse): 10%
        fs.writeFileSync(`${city.name} - request data.json`, cityJson); // bonus feature - zapis danych użytych do zapytania do pliku JSON.
        console.log(cityJson)

        const weather = await getWeather(city);
        const { temp, humidity, pressure } = weather.main;

        console.log(getMessage(temp, humidity, pressure));

        let doc = new pdf();
        doc.pipe(fs.createWriteStream(`Weather in ${city.name}.pdf`)); // WYMAGANIA swykorzystanie strumienia
        doc.text(getMessage(temp, humidity, pressure));
        doc.end();
    } else if (chosenOption === '2') {
        console.log('Podaj nazwę własną lokalizacji (potwierdź ENTER):');
        const cityName = prompt();
        console.log('Szerokość geograficzna (potwierdź ENTER):');
        const latitude = prompt();
        console.log('Długość geograficzna (potwierdź ENTER):');
        const longtitude = prompt();

        const weather = await getWeather({ cityName: cityName, latitude, longtitude });
        const { temp, humidity, pressure } = weather.main;

        console.log(getMessage(temp, humidity, pressure));

        let doc = new pdf();
        doc.pipe(fs.createWriteStream(`Weather in ${latitude}, ${longtitude}.pdf`)); // WYMAGANIA wykorzystanie strumienia: 10%
        doc.text(getMessage(temp, humidity, pressure));
        doc.end();
    } else {
        console.log('Niepoprawna opcja. Wyłączenie programu.');
        process.exit(-1);
    }
}

main(); // Działanie zgodne ze specyfikacją i pobieranie prawidłowej pogody 20%