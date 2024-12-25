#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>

// Pin Definitions
#define PIR_PIN 3
#define SMOKE_SENSOR_PIN A1
#define DHT_PIN 2
#define LED_PIN 13
#define BELL_PIN 12

// PIR Motion Sensor
const unsigned long PIR_ACTIVE_DURATION = 120000; // 2 minutes
bool pirMotionDetected = false;
unsigned long pirMotionTimer = 0;

// Smoke Sensor
const int SMOKE_THRESHOLD = 225;
const int SMOKE_HYSTERESIS = 5;
#define SAMPLE_SIZE 10
int smokeSamples[SAMPLE_SIZE] = {0};
int smokeIndex = 0;
int smokeTotal = 0;
bool smokeDetected = false;

// DHT Sensor
#define DHTTYPE DHT22
DHT_Unified dht(DHT_PIN, DHTTYPE);
uint32_t dhtDelayMS;

// Function Prototypes
void initializeSensors();
void handlePIRSensor();
void handleSmokeSensor();
void handleDHTSensor();
void addSmokeSample(int value);
int getSmokeAverage();
void printSensorData(float temperature, float humidity, const char* motionStatus, const char* smokeStatus);

void setup() {
  Serial.begin(9600);

  pinMode(PIR_PIN, INPUT);
  pinMode(SMOKE_SENSOR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BELL_PIN, OUTPUT);

  digitalWrite(LED_PIN, HIGH); // LED off
  digitalWrite(BELL_PIN, LOW); // Alarm off

  initializeSensors();
}

void loop() {
  handlePIRSensor();
  handleSmokeSensor();
  handleDHTSensor();

  delay(1000); // Main loop delay
}

// Initialize DHT Sensor
void initializeSensors() {
  dht.begin();
  sensor_t sensor;
  dht.temperature().getSensor(&sensor);
  dhtDelayMS = sensor.min_delay / 1000;
}

// Handle PIR Motion Sensor
void handlePIRSensor() {
  int pirState = digitalRead(PIR_PIN);
  if (pirState == HIGH) {
    pirMotionDetected = true;
    pirMotionTimer = millis();
    digitalWrite(LED_PIN, LOW); // LED on
  }

  if (pirMotionDetected && (millis() - pirMotionTimer > PIR_ACTIVE_DURATION)) {
    pirMotionDetected = false;
    digitalWrite(LED_PIN, HIGH); // LED off
  }
}

// Handle Smoke Sensor
void handleSmokeSensor() {
  int rawSmokeData = analogRead(SMOKE_SENSOR_PIN);
  addSmokeSample(rawSmokeData);
  int smokeAverage = getSmokeAverage();

  if (smokeAverage >= SMOKE_THRESHOLD + SMOKE_HYSTERESIS && !smokeDetected) {
    digitalWrite(LED_PIN, LOW); // LED on
    digitalWrite(BELL_PIN, HIGH); // Activate alarm
    smokeDetected = true;
  } else if (smokeAverage <= SMOKE_THRESHOLD - SMOKE_HYSTERESIS && smokeDetected) {
    digitalWrite(LED_PIN, HIGH); // LED off
    digitalWrite(BELL_PIN, LOW); // Deactivate alarm
    smokeDetected = false;
  }
}

// Handle DHT Sensor
void handleDHTSensor() {
  delay(dhtDelayMS);

  float temperature = NAN, humidity = NAN;
  sensors_event_t event;

  dht.temperature().getEvent(&event);
  if (!isnan(event.temperature)) {
    temperature = event.temperature;
  }

  dht.humidity().getEvent(&event);
  if (!isnan(event.relative_humidity)) {
    humidity = event.relative_humidity;
  }

  const char* motionStatus = pirMotionDetected ? "Motion Detected" : "No Motion";
  const char* smokeStatus = smokeDetected ? "Smoke Detected" : "No Smoke";

  printSensorData(temperature, humidity, motionStatus, smokeStatus);
}

// Add Smoke Sensor Sample
void addSmokeSample(int value) {
  smokeTotal -= smokeSamples[smokeIndex];
  smokeSamples[smokeIndex] = value;
  smokeTotal += value;
  smokeIndex = (smokeIndex + 1) % SAMPLE_SIZE;
}

// Calculate Average Smoke Value
int getSmokeAverage() {
  return smokeTotal / SAMPLE_SIZE;
}

// Print Sensor Data
void printSensorData(float temperature, float humidity, const char* motionStatus, const char* smokeStatus) {
  Serial.println("=================================");
  if (!isnan(temperature)) {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println("°C");
  } else {
    Serial.println("Temperature: Error reading!");
  }

  if (!isnan(humidity)) {
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println("%");
  } else {
    Serial.println("Humidity: Error reading!");
  }

  Serial.print("Motion Status: ");
  Serial.println(motionStatus);

  Serial.print("Smoke Status: ");
  Serial.println(smokeStatus);
  Serial.println("=================================");
}