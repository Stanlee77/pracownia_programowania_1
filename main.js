const axios = require('axios');
const prompt = require('prompt-sync')();
const pdf = require('pdfkit'); // WYMAGANIA biblioteka pdf: 20%
const { writeFileSync, createWriteStream} = require('fs');

// test data
const tests = [ // WYMAGANIA testy I: min 2x pozytywny + 1x negatywny: 30%
    { name: 'Poznan', latitude: 52.4064, longtitude: 16.9252 },
    { name: 'Londyn', latitude: 51.5074, longtitude: 0.1278 },
    { name: 'Tokio', latitude: 35.6762, longtitude: 139.6503 },
    { name: 'Sztokholm (test negatywny)', latitude: 59.3293 }, // negatywny - brak części współrzędnych
    { name: 'Berlin', latitude: 52.5200, longtitude: 13.4050 },
];

const mockData = [ // WYMAGANIA testy II: 2x pozytywny, 1x negatywny: 30%
    {
        name: 'Nibylandia',
        main: {
            temp: 99,
            humidity: 0,
            pressure: 10,
        }
    },
    {
        name: 'Atlantyda',
        main: {
            temp: 5.2,
            humidity: Infinity,
            pressure: 100900,
        }
    },
    {
        name: 'Złalandia',
        main: {
            // test negatywny
        }
    },
];

// feature functions
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

// export to file functions
async function saveToFile(cityName, weather) {
    const { temp, humidity, pressure } = weather.main;
    if (temp === undefined || humidity === undefined || pressure === undefined) {
        console.log('Brak pewnych danych pogodowych dla miasta: ' + ((cityName) ?? '(nie podano nazwy miasta)') + '.');
        console.log('Wyłączenie programu.')
        process.exit(-1);
    }
    console.log(getMessage(temp, humidity, pressure));
    try {
        const fileName = `Weather in ${cityName}`;

        console.log((`W jakim formacie chcesz zapisać dane lokalizacji: ${cityName ?? '(nie podano nazwy lokalizacji)'} (potwierdź ENTER):
    1. JSON
    2. PDF
    3. XML
    `))
        const choice = prompt();

        switch (choice) {
            case '1':
                saveToJson(fileName, { temp, humidity, pressure });
                break;
            case '2':
                saveToPdf(fileName, { temp, humidity, pressure });
                break;
            case '3':
                saveToXml(fileName, { temp, humidity, pressure });
                break;
            default:
                console.log('Niepoprawna opcja. Wyłączenie programu.');
                process.exit(-1);
        }

    } catch (e) {
        console.log('Nie udało się zapisać danych pogodowych dla miasta: ' + ((cityName) ?? '(nie podano nazwy miasta)') + '.');
        console.log('Wiadomość błędu: ', e.message);
    }
}

async function saveToPdf(cityName, { temp, humidity, pressure }) {
    let doc = new pdf();
    doc.pipe(createWriteStream(`${cityName}.pdf`)); // WYMAGANIA wykorzystanie strumienia: 10%
    doc.text(getMessage(temp, humidity, pressure));
    doc.end();
}

async function saveToJson(cityName, { temp, humidity, pressure }) {
    const serializedJson = JSON.stringify(getMessage(temp, humidity, pressure)); // WYMAGANIA serializacja JSONa (deserializacją zajmuje się axios w getWeather - używa JSON.parse): 10%

    writeFileSync(`${cityName}.json`, serializedJson);
}
async function saveToXml(cityName, { temp, humidity, pressure }) {
    const serializedXml = `<weather>
    <cityName>${cityName}</cityName>
    <temp>${temp}</temp>
    <humidity>${humidity}</humidity>
    <pressure>${pressure}</pressure>
    </weather>`;
    writeFileSync(`${cityName}.xml`, serializedXml);
}

// main
async function main() {
    console.log(`Wybierz opcję (potwierdź ENTER):
    1. Wybierz miasto z listy
    2. Podaj współrzędne lokalizacji
    3. Wykonaj test zapisywania ze zmockowanymi danymi
    `);
    const chosenOption = prompt();
    if (chosenOption === '1') {
        tests.forEach((city, index) => console.log(`${index + 1}. ${city.name}`));

        console.log('Wybierz miasto (potwierdź ENTER):');
        const chosenCity = prompt();
        const city = tests[Number(chosenCity) - 1];

        const weather = await getWeather(city);
        saveToFile(city.name, weather);
    } else if (chosenOption === '2') {
        console.log('Podaj nazwę własną lokalizacji (potwierdź ENTER):');
        const cityName = prompt();
        console.log('Szerokość geograficzna (potwierdź ENTER):');
        const latitude = prompt();
        console.log('Długość geograficzna (potwierdź ENTER):');
        const longtitude = prompt();

        const weather = await getWeather({ cityName: cityName, latitude, longtitude });
        saveToFile(cityName, weather);
    } else if (chosenOption === '3') {
        mockData.forEach((city) => {
            saveToFile((city && city?.name), city);
        });
    }
    else {
        console.log('Niepoprawna opcja. Wyłączenie programu.');
        process.exit(-1);
    }
}

main(); // Działanie zgodne ze specyfikacją i pobieranie prawidłowej pogody 20%