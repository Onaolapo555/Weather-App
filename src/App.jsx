import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import weatherLogo from '../src/assets/images/logo.svg';




export default function App() {

  // Gemini Weather Insight
  const [weatherInsight, setWeatherInsight] = useState('');
const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

const generateWeatherInsight = async (current) => {
  if (!current) return;

  setIsGeneratingInsight(true);
  setWeatherInsight("Thinking about today's weather...");


  const apiKey = "AIzaSyBCiUEtxaWQmQ8y2JlVbIhtj3C6riO-KOU";   // ← Replace with your real key

  const prompt = `You are a friendly weather assistant. 
  Current temperature: ${current.temperature_2m}°${tempUnit === 'celsius' ? 'C' : 'F'}
  Feels like: ${current.apparent_temperature}°${tempUnit === 'celsius' ? 'C' : 'F'}
  Humidity: ${current.relative_humidity_2m}%
  Wind speed: ${current.wind_speed_10m} ${windUnit === 'kmh' ? 'km/h' : 'mph'}
  Precipitation: ${current.precipitation} ${precipUnit === 'mm' ? 'mm' : 'inch'}

  Write a short, natural, friendly, and helpful insight (1-2 sentences max). 
  Make it sound human and useful.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const insight = response.data.candidates[0].content.parts[0].text;
    setWeatherInsight(insight);
  } catch (err) {
    setWeatherInsight("Couldn't generate insight right now. But the weather looks interesting!");
    console.error(err);
  } finally {
    setIsGeneratingInsight(false);
  }
};


  // Units states
  const [tempUnit, setTempUnit] = useState('celsius');
  const [windUnit, setWindUnit] = useState('kmh');
  const [precipUnit, setPrecipUnit] = useState('mm');

  // Search & location states
  const [searchLocation, setSearchLocation] = useState('Berlin');
  const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
  const [locationName, setLocationName] = useState('Berlin, Germany');
  const [isSearching, setIsSearching] = useState(false);  

  // Weather data & UI states
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Geocoding
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!searchLocation) return;

      setIsLoading(true);
      setError('');

      try {
        const response = await axios.get(
          `https://geocoding-api.open-meteo.com/v1/search?name=${searchLocation}&count=1&language=en&format=json`
        );

        const results = response.data.results;
        if (results && results.length > 0) {
          const place = results[0];
          setCoordinates({ lat: place.latitude, lon: place.longitude });
          setLocationName(
            `${place.name}, ${place.country || place.admin1 || ''}`.trim().replace(/,$/, '')
          );
        } else {
          setError('Location not found. Try another place.');
          setWeatherData(null);
        }
      } catch (err) {
        setError('No search result found!');
      }
      setIsLoading(false);
      setIsSearching(false);
    };

    fetchCoordinates();
  }, [searchLocation]);

  // Weather fetch (with the fix applied)
  useEffect(() => {
    const fetchWeather = async () => {
      if (!coordinates.lat || !coordinates.lon) return;

      setIsLoading(true);
      setError('');

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max,weather_code&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto`;

        const response = await axios.get(url);
        setWeatherData(response.data);
      } catch (err) {
        setError('Error fetching weather data.');
        console.error(err);
      } finally{
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [coordinates, tempUnit, windUnit, precipUnit]);

  // useEffect for generateWeatherInsight
  useEffect(() => {
  if (weatherData?.current) {
    generateWeatherInsight(weatherData.current);
  }
}, [weatherData, tempUnit, windUnit, precipUnit]);

  return (
    <div className="m-auto w-[90%]">
      <HeroSection
        tempUnit={tempUnit}
        setTempUnit={setTempUnit}
        windUnit={windUnit}
        setWindUnit={setWindUnit}
        precipUnit={precipUnit}
        setPrecipUnit={setPrecipUnit}
      />
      <Header />
      {/* <SearchForm onSearch={setSearchLocation} /> */}
      <SearchForm
      isSearching={isSearching}
       onSearch={(value) => { 
         setIsSearching(true);         
         setSearchLocation(value);
         }} />
      <div className="lg:flex gap-10">
        <Card
          weatherData={weatherData}
          locationName={locationName}
          isLoading={isLoading}
          error={error}
          tempUnit={tempUnit}
          windUnit={windUnit}
          precipUnit={precipUnit}
          weatherInsight={weatherInsight}
          isGeneratingInsight={isGeneratingInsight}
        />
        <HourlyForecast
          weatherData={weatherData}
          isLoading={isLoading}
          error={error}
          tempUnit={tempUnit}
        />
      </div>
    </div>
  );
}


function HeroSection({ tempUnit, setTempUnit, windUnit, setWindUnit, precipUnit, setPrecipUnit }) {
  const isAllMetric = tempUnit === 'celsius' && windUnit === 'kmh' && precipUnit === 'mm';
  const isAllImperial = tempUnit === 'fahrenheit' && windUnit === 'mph' && precipUnit === 'inch';

  const switchToImperial = () => {
    setTempUnit('fahrenheit');
    setWindUnit('mph');
    setPrecipUnit('inch');
  };

  const switchToMetric = () => {
    setTempUnit('celsius');
    setWindUnit('kmh');
    setPrecipUnit('mm');
  };

  return (
    <div className="mt-6 mb-12">
      <ul className="flex justify-between items-center">
        <div>
          <img classame="w-40" src="/assets/images/logo.svg"  alt="logo" />
        </div>
        <UnitsSelector
          tempUnit={tempUnit}
          setTempUnit={setTempUnit}
          windUnit={windUnit}
          setWindUnit={setWindUnit}
          precipUnit={precipUnit}
          setPrecipUnit={setPrecipUnit}
          isAllMetric={isAllMetric}
          isAllImperial={isAllImperial}
          switchToImperial={switchToImperial}
          switchToMetric={switchToMetric}
        />
      </ul>
    </div>
  );
}

function UnitsSelector({ tempUnit, setTempUnit, windUnit, setWindUnit, precipUnit, setPrecipUnit, isAllMetric, isAllImperial, switchToImperial, switchToMetric }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="bg-[#25253f] rounded-xl px-3 py-2 flex items-center gap-3 text-sm hover:opacity-90 hover:cursor-pointer">
        <img src="/assets/images/icon-units.svg" alt="units" />
        <span>Units</span>
        <img src="/assets/images/icon-dropdown.svg" alt="dropdown" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-62 bg-[#1e1e2d] rounded-2xl shadow-2xl p-5 text-white z-50">
          {isAllMetric && <div onClick={() => { switchToImperial(); setIsOpen(false); }} className="text-2xl font-bold mb-6 cursor-pointer">Switch to Imperial</div>}
          {isAllImperial && <div onClick={() => { switchToMetric(); setIsOpen(false); }} className="text-2xl font-bold mb-6 cursor-pointer">Switch to Metric</div>}

          <div className="mb-5">
            <p className="text-sm opacity-70 mb-3">Temperature</p>
            <div onClick={() => setTempUnit('celsius')} className={`p-2 rounded-xl cursor-pointer flex justify-between items-center mb-2 ${tempUnit === 'celsius' ? 'bg-[#2d2d44]' : ''}`}>
              <span className="text-md">Celsius (°C)</span>
              {tempUnit === 'celsius' && <span><img src="/assets/images/icon-checkmark.svg" alt="" /></span>}
            </div>
            <div onClick={() => setTempUnit('fahrenheit')} className={`p-2 rounded-xl cursor-pointer flex justify-between items-center ${tempUnit === 'fahrenheit' ? 'bg-[#2d2d44]' : ''}`}>
              <span className="text-md">Fahrenheit (°F)</span>
              {tempUnit === 'fahrenheit' && <span><img src="/assets/images/icon-checkmark.svg" alt="" /></span>}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-sm opacity-70 mb-3">Wind Speed</p>
            <div onClick={() => setWindUnit('kmh')} className={`p-2 rounded-xl cursor-pointer flex justify-between items-center mb-2 ${windUnit === 'kmh' ? 'bg-[#2d2d44]' : ''}`}>
              <span className="text-md">km/h</span>
              {windUnit === 'kmh' && <span className="text-xl"><img src="/assets/images/icon-checkmark.svg" alt="" /></span>}
            </div>
            <div onClick={() => setWindUnit('mph')} className={`p-2 rounded-xl cursor-pointer flex justify-between items-center ${windUnit === 'mph' ? 'bg-[#2d2d44]' : ''}`}>
              <span className="text-md">mph</span>
              {windUnit === 'mph' && <span><img src="/public/assets/images/icon-checkmark.svg" alt="" /></span>}
            </div>
          </div>

          <div>
            <p className="text-sm opacity-70 mb-3">Precipitation</p>
            <div onClick={() => setPrecipUnit('mm')} className={`p-2 rounded-xl cursor-pointer flex justify-between items-center mb-2 ${precipUnit === 'mm' ? 'bg-[#2d2d44]' : ''}`}>
              <span className="text-md">mm</span>
              {precipUnit === 'mm' && <span><img src="/assets/images/icon-checkmark.svg" alt="" /></span>}
            </div>
            <div onClick={() => setPrecipUnit('inch')} className={`p-2 rounded-xl cursor-pointer flex justify-between items-center ${precipUnit === 'inch' ? 'bg-[#2d2d44]' : ''}`}>
              <span className="text-md">inch</span>
              {precipUnit === 'inch' && <span><img src="/assets/images/icon-checkmark.svg" alt="" /></span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-20">
      <h1 className="text-5xl lg:text-7xl text-center font-semibold">How's the sky looking today?</h1>
    </div>
  );
}

function SearchForm({ onSearch, isSearching }) {
  const [inputValue, setInputValue] = useState('');

  const handleSearch = () => {
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="max-w-4xl m-auto">
      <ul className="lg:flex justify-between gap-10 mb-1 items-baseline p-2">
        <div className="relative mb-5 self-center w-full">
          <input
            className="text-2xl p-5 pl-12 max-lg:text-center bg-[#25253f] rounded-xl border border-gray-500 w-full focus:outline-none focus:ring-blue-500"
            type="text"
            placeholder="Search for a place..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <img className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" src="/assets/images/icon-search.svg" alt="" />
        </div>

        <button onClick={handleSearch} 
        disabled={isSearching}
        className={`max-lg:w-full px-8 py-5 text-2xl rounded-xl text-center bg-blue-500 hover:bg-blue-600 ${isSearching ? 'opacity-70 cursor-not-allowed' : 'hover:cursor-pointer'}`}>
          {isSearching ? 'Searching...' : 'Search'}
          </button>
      </ul>
                    {isSearching && (
  <div className="mt-4 text-center mb-10">
    <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#25253f] rounded-xl text-white font-medium">
      <div className="flex space-x-1">
        <img src="/assets/images/icon-search.svg" alt="logo" />
      </div>
      <span>Search in progress...</span>
    </div>
  </div>
)}
    </div>
  );
}

function getIconFromCode(code) {
  if ([0, 1].includes(code)) return "./assets/images/icon-sunny.webp";
  if (code === 2) return "./assets/images/icon-partly-cloudy.webp";
  if (code === 3) return "./assets/images/icon-overcast.webp";
  if ([45, 48].includes(code)) return "./assets/images/icon-fog.webp";
  if ([51, 53, 55, 56, 57].includes(code)) return "./assets/images/icon-drizzle.webp";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "./assets/images/icon-rain.webp";
  if ([71, 73, 75, 77].includes(code)) return "./assets/images/icon-snow.webp";
  if ([95, 96, 99].includes(code)) return "./assets/images/icon-storm.webp";
  return "./assets/images/icon-overcast.webp";
}



function Card({ weatherData, locationName, isLoading, error, tempUnit, windUnit, precipUnit, weatherInsight, isGeneratingInsight, }) {
  if (isLoading) return <div className="text-center w-full m-auto text-3xl text-white">
  <div>
     {/* Testing skeleton laoding  */}
  <div className='font-light text-md w-full'>
  <div className=' flex items-center justify-center animate-pulse bg-[#25253f]  w-[95%] m-auto h-60 rounded-lg mb-10'>
    Loading state
  </div>
  <div className=' w-[95%] m-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mb-15 '>
    <div className='animate-pulse bg-[#25253f] lg:h-40  h-20 rounded-md'></div>
    <div className='animate-pulse bg-[#25253f] lg:h-40  h-20 rounded-md '></div>
    <div className='animate-pulse bg-[#25253f] lg:h-40 h-20 rounded-md'></div>
    <div className='animate-pulse  bg-[#25253f] lg:h-40  h-20  rounded-md'></div>
  </div>
  <div className='w-[95%] m-auto grid grid-cols-3 lg:grid-cols-7 gap-4 mb-20' >
    <div className=' h-40 lg:h-50  rounded-md animate-pulse bg-[#25253f] '></div>
    <div className=' h-40 lg:h-50 rounded-md animate-pulse bg-[#25253f] '></div>
    <div className=' h-40 lg:h-50 rounded-md animate-pulse bg-[#25253f] '></div>
    <div className=' h-40 lg:h-50 rounded-md animate-pulse bg-[#25253f] '></div>
    <div className=' h-40 lg:h-50 rounded-md animate-pulse bg-[#25253f] '></div>
    <div className=' h-40 lg:h-50 rounded-md animate-pulse bg-[#25253f] '></div>
    <div className=' h-40 lg:h-50 rounded-md animate-pulse bg-[#25253f] '></div>
  </div>
  </div>
  </div>
  </div>;

  if (error) return <div className="text-center m-auto font-bold text-white text-3xl  w-full">{error}
  </div>;
  if (!weatherData) return <div className="text-center text-white text-2xl">Search for a place!</div>;

  const current = weatherData.current;
  const daily = weatherData.daily;

  const tempSymbol = tempUnit === 'celsius' ? '°C' : '°F';
  const windSymbol = windUnit === 'kmh' ? 'km/h' : 'mph';
  const precipSymbol = precipUnit === 'mm' ? 'mm' : 'in';

  const currentDate = new Date(current.time).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="mb-20 flex-1 ">
      <div className="card rounded-2xl w-full text-white bg-cover bg-center bg-no-repeat bg-fixed mb-10 ">
        <main className="w-[80%] m-auto py-4 text-center">
          <h3 className="text-3xl mb-3 font-bold mt-4">{locationName}</h3>
          <p className="text-lg mb-2">{currentDate}</p>
          <ul className="flex items-center justify-between m-auto mb-5 ">
            <img classame="w-30" src={getIconFromCode(current.weather_code)} alt="current weather" />
            <h1 className="text-6xl">{Math.round(current.temperature_2m)}{tempSymbol}</h1>
          </ul>
        </main>
      </div>

      <section className="lg:flex lg:justify-between grid grid-cols-2 gap-5 mb-10">
        <main className="smallcards">
          <p className="mb-3 font-semibold">Feels like</p>
          <h3 className="text-2xl font-semibold">{Math.round(current.apparent_temperature)}{tempSymbol}</h3>
        </main>
        <main className="smallcards">
          <p className="mb-3 font-semibold">Humidity</p>
          <h3 className="text-2xl font-semibold">{Math.round(current.relative_humidity_2m)}%</h3>
        </main>
        <main className="smallcards">
          <p className="mb-3 font-semibold">Wind</p>
          <h3 className="text-2xl font-semibold">{Math.round(current.wind_speed_10m)} {windSymbol}</h3>
        </main>
        <main className="smallcards">
          <p className="mb-3 font-semibold">Precipitation</p>
          <h3 className="text-2xl font-semibold">{current.precipitation} {precipSymbol}</h3>
        </main>
      </section>

      <div>
        <h3 className="text-2xl font-semibold mb-5">Daily Forecast</h3>
        <section className="lg:flex grid grid-cols-3 gap-5">
          {daily.time.slice(0, 7).map((dateStr, i) => {
            const dayDate = new Date(dateStr);
            const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <main key={i} className="thincards">
                <p className="text-center text-xl font-semibold">{dayName}</p>
                <img src={getIconFromCode(daily.weather_code[i])} alt="daily icon" />
                <h5 className="flex justify-between font-semibold">
                  <span>{Math.round(daily.temperature_2m_max[i])}{tempSymbol}</span>
                  <span>{Math.round(daily.temperature_2m_min[i])}{tempSymbol}</span>
                </h5>
              </main>
            );
          })}
        </section>
      </div>
      {/* AI Weather Insight */}
      <div className=' '>
{weatherInsight && (
  <div className="mx-auto w-[80%] mt-6 bg-[#25253f] border-[#3a3a5a] rounded-2xl p-5 text-left border">
    <p className="text-sm uppercase tracking-widest text-blue-400 mb-2">AI Insight</p>
    <p className="text-lg leading-relaxed text-white">
      {isGeneratingInsight ? "✦ Thinking about the weather..." : weatherInsight}
    </p>
  </div>
)}
</div>
    </div>
  );
}

function HourlyForecast({ weatherData, isLoading, error, tempUnit }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isLoading || error || !weatherData) return null;

  const hourly = weatherData.hourly;
  const daily = weatherData.daily;
  const tempSymbol = tempUnit === 'celsius' ? '°C' : '°F';

  const getFullDayName = (index) => {
    return new Date(daily.time[index]).toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Find the index of the hour closest to now
  const now = new Date();
  let closestIndex = 0;
  let smallestDiff = Infinity;

  hourly.time.forEach((timeStr, index) => {
    const hourTime = new Date(timeStr);
    const diff = Math.abs(now - hourTime);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestIndex = index;
    }
  });

  // Start from the closest current hour, show next 
  const startIndex = closestIndex;
  const hoursToShow = hourly.time.slice(startIndex, startIndex + 8);

  return (
    <div className="mb-10 lg:w-1/3">
      <section className="bg-[#25253f] p-4 rounded-2xl">
        <div className="flex justify-between items-center mb-5 font-semibold">
          <h2 className="text-xl">Hourly forecast</h2>

          {/* Optional: keep day selector if you want, or remove it */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-[#42425c] rounded-lg py-2 px-3 flex items-center gap-2"
            >
              <span>{getFullDayName(selectedDayIndex)}</span>
              <img src="/assets/images/icon-dropdown.svg" alt="dropdown" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#42425c] rounded-lg shadow-lg z-50">
                {daily.time.slice(0, 7).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedDayIndex(i);
                      setIsDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-[#555] cursor-pointer"
                  >
                    {getFullDayName(i)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Always show exactly 8 next hours */}
        <div className="space-y-3">
          {hoursToShow.map((timeStr, i) => {
            const hourIndex = startIndex + i;
            const time = new Date(timeStr).toLocaleTimeString('en-US', {
              hour: 'numeric',
              hour12: true,
            });
            const temp = Math.round(hourly.temperature_2m[hourIndex]);

            return (
              <main key={i} className="hourinner flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img
                  className="w-12"
                    src={getIconFromCode(hourly.weather_code[hourIndex])}
                    alt="hour icon"
                  />
                  <h4>{time}</h4>
                </div>
                <div>
                  {temp}
                  {tempSymbol}
                </div>
              </main>
            );
          })}
        </div>
      </section>
    </div>
  );
}


// AIzaSyBCiUEtxaWQmQ8y2JlVbIhtj3C6riO-KOU