Alias: LOINC = http://loinc.org

Profile: RecordsMiniObservation
Parent: Observation
Id: records-mini-observation
Title: "Records Mini Observation"
Description: "Minimal fixture profile used to test FSH source mapping."
* status 1..1
* code 1..1
* subject 1..1

Instance: MiniObservationMissingCode
InstanceOf: RecordsMiniObservation
Usage: #example
* status = #final
* subject = Reference(Patient/example)
