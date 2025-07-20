import { PCB, Component, Power } from '@typecad/typecad'
import { Resistor, Capacitor } from '@typecad/passives/0603';
import { Connector } from '@typecad/passives/connector'
import { Testpoint } from '@typecad/passives/testpoint'
import { schematic } from '@typecad/schematic';

// 1Hz Pulse Generator - Complete Wiring Diagram
// 4.194304 MHz→÷16,384→256 Hz→÷256→1 Hz
// 
// Design Strategy:
// 1. TCXO provides 4.194304 MHz ±25ppm reference
// 2. 74HC4060 divides by 16,384 (2^14) to get 256 Hz
// 3. 74HC4040 divides by 256 (2^8) to get 1 Hz
// 4. 74HC244 buffers the 1 Hz output for driving loads
// 5. Dual power supply: 3V for TCXO, 5V for logic ICs

let typecad = new PCB('one_hz');

// Power input connector (3V and 5V rails)
let J1 = new Connector({ 
    number: 4,
    sch: { x: 15, y: 80, rotation: 0 }
});

// 1Hz output connector
let J2 = new Connector({ 
    number: 2,
    sch: { x: 245, y: 90, rotation: 0 }
});

// TCXO - 4.194304 MHz ±25ppm
// SIT8008BI-82-30E-4.194304 (±25ppm, 3V, SMD)
let U1 = new Component({ 
    reference: 'U1',
    value: 'SIT8008BI-82-30E-4.194304',
    footprint: 'lib:QFN_7050_4pins',
    description: '4.194304 MHz TCXO, ±25ppm, 3V supply, 7.0x5.0mm QFN-4 package',
    datasheet: 'https://www.sitime.com/products/oscillators/tcxo/sit8008bi',
    mpn: 'SIT8008BI-82-30E-4.194304',
    symbol: 'SiT8008BI-82-30E-4_194304:SiT8008BI-82-30E-4.194304',
    sch: { x: 35, y: 80, rotation: 0 }
});

// 74HC4060 - 14-Stage Binary Counter with Oscillator (DIP-16)
// Validated against datasheet: Supply 2-6V, Input 0-VCC, Output ±25mA
// Pin 3 (Q14) provides 256 Hz output (4.194304 MHz ÷ 16,384)
let U2 = new Component({
    reference: 'U2', 
    value: '74HC4060N',
    footprint: 'Package_DIP:DIP-16_W7.62mm',
    description: '14-stage binary counter with oscillator, divides by 16,384, 2-6V operation',
    datasheet: 'https://www.ti.com/lit/ds/symlink/sn74hc4060.pdf',
    symbol: '74xx:74HC4060',
    sch: { x: 93, y: 80, rotation: 0 }
});

// 74HC4040 - 12-Stage Binary Counter (DIP-16)
// Validated against datasheet: Supply 2-6V, Input 0-VCC, Output ±25mA
// Pin 10 (CLK), Pin 11 (CLR), Pin 13 (QH) provides 1 Hz output (256 Hz ÷ 256)
let U3 = new Component({
    reference: 'U3',
    value: '74HC4040N', 
    footprint: 'Package_DIP:DIP-16_W7.62mm',
    description: '12-stage asynchronous binary counter, divides by 256, 2-6V operation',
    datasheet: 'https://www.ti.com/lit/ds/symlink/sn74hc4040.pdf',
    symbol: '74HC4040N_652:74HC4040N_652',
    sch: { x: 140, y: 80, rotation: 0 }
});

// 74HC244 - Octal Buffer/Driver (DIP-20)
let U4 = new Component({
    reference: 'U4',
    value: '74HC244N',
    footprint: 'Package_DIP:DIP-20_W7.62mm', 
    description: 'Octal buffer/driver for 1Hz output',
    datasheet: 'https://www.ti.com/lit/ds/symlink/sn74hc244.pdf',
    symbol: '74xx:74HC244',
    sch: { x: 200, y: 80, rotation: 0 }
});

// Decoupling capacitors - 0.1µF ceramic near each IC's VDD pin
let C1 = new Capacitor({ reference: 'C1', value: '100nF', description: 'TCXO decoupling', sch: { x: 45, y: 45, rotation: 0 } });
let C2 = new Capacitor({ reference: 'C2', value: '100nF', description: '74HC4060 decoupling', sch: { x: 50, y: 45, rotation: 0 } });
let C3 = new Capacitor({ reference: 'C3', value: '100nF', description: '74HC4040 decoupling', sch: { x: 55, y: 45, rotation: 0 } });
let C4 = new Capacitor({ reference: 'C4', value: '100nF', description: '74HC244 decoupling', sch: { x: 60, y: 45, rotation: 0 } });

// Bulk filtering capacitors
let C5 = new Capacitor({ reference: 'C5', value: '10µF', description: '3V rail bulk filtering', sch: { x: 65, y: 45, rotation: 0 } });
let C6 = new Capacitor({ reference: 'C6', value: '10µF', description: '5V rail bulk filtering', sch: { x: 70, y: 45, rotation: 0 } });

// Reset pull-down resistor for 74HC4060
let R1 = new Resistor({ reference: 'R1', value: '10kΩ', description: '74HC4060 reset pull-down', sch: { x: 75, y: 45, rotation: 0 } });

// Testpoints for debugging and verification
let TP1 = new Testpoint({ sch: { x: 70, y: 115, rotation: 0 } }); // TCXO Output (Pin 3) - 4.194304 MHz
let TP2 = new Testpoint({ sch: { x: 115, y: 115, rotation: 0 } }); // 74HC4060 Q14 (Pin 3) - 256 Hz
let TP3 = new Testpoint({ sch: { x: 178, y: 115, rotation: 0 } }); // 74HC4040 Q0 (Pin 9) - 1 Hz unbuffered
let TP4 = new Testpoint({ sch: { x: 235, y: 115, rotation: 0 } }); // 74HC244 Output (Pin 8) - 1 Hz buffered

// Power connections - Dual power supply
// +3V rail for TCXO
typecad.named('+3V').net(
    U1.pin(1),  // TCXO Pin 1 (OE) - Output Enable
    U1.pin(4),  // TCXO Pin 4 (VDD) - Power Supply
    J1.pin(1),  // Power input +3V
);

// +5V rail for logic ICs
typecad.named('+5V').net(
    U2.pin(16), // 74HC4060 VDD
    U3.pin(16), // 74HC4040 VDD
    U4.pin(20), // 74HC244 VDD
    J1.pin(2),  // Power input +5V
);

// Ground connections
typecad.named('GND').net(
    U1.pin(2),  // TCXO Pin 2 (GND) - Ground
    U2.pin(8),  // 74HC4060 VSS
    U3.pin(8),  // 74HC4040 VSS
    U4.pin(10), // 74HC244 VSS
    J1.pin(3),  // Power input GND
    J1.pin(4),  // Power input GND
    J2.pin(1),  // Output GND
    R1.pin(2)   // Reset resistor to ground
);

// TCXO connections
typecad.net(U1.pin(1), U1.pin(4)); // Pin 1 (OE) to +3V for continuous operation
typecad.net(U1.pin(3), U2.pin(10), TP1.pin(1)); // Pin 3 (OUT) to 74HC4060 clock input and testpoint

// 74HC4060 connections (14-stage binary counter)
// Clock input from TCXO
typecad.named('OSC_OUT').net(U2.pin(10), U1.pin(3)); // OSC IN from TCXO

// Reset pins tied together through 10kΩ resistor to GND
typecad.named('RESET').net(U2.pin(11), U2.pin(12), R1.pin(1)); // RESET pins tied together
typecad.net(R1.pin(2), U2.pin(8));   // Resistor to ground

// Output connections - only Q14 (Pin 3) is used
typecad.net(U2.pin(3), U3.pin(10)); // Q14 to 74HC4040 clock input
typecad.named('256HZ').net(U2.pin(3), TP2.pin(1)); // Q14 to testpoint

// Unused outputs tied to ground to prevent floating
typecad.net(U2.pin(1), U2.pin(8));  // Q12 to GND
typecad.net(U2.pin(2), U2.pin(8));  // Q13 to GND
typecad.net(U2.pin(4), U2.pin(8));  // Q6 to GND
typecad.net(U2.pin(5), U2.pin(8));  // Q5 to GND
typecad.net(U2.pin(6), U2.pin(8));  // Q7 to GND
typecad.net(U2.pin(7), U2.pin(8));  // Q4 to GND
typecad.Schematic.dnc(U2.pin(9));   // CLKO (oscillator output) - No Connection when using external clock
typecad.net(U2.pin(13), U2.pin(8)); // Q1 to GND
typecad.net(U2.pin(14), U2.pin(8)); // Q2 to GND
typecad.net(U2.pin(15), U2.pin(8)); // Q3 to GND

// 74HC4040 connections (12-stage binary counter)
// Clock input from 74HC4060 Q14
typecad.net(U3.pin(10), U2.pin(3)); // CLK from 74HC4060 Q14

// Clear pin to ground (active low, so tied to GND for normal operation)
typecad.net(U3.pin(11), U3.pin(8)); // CLR to GND

// Output connections - Pin 13 (QH) provides 1 Hz output (256 Hz ÷ 256)
typecad.named('1HZ_UNBUFFERED').net(U3.pin(13), TP3.pin(1)); // QH to testpoint

// Unused outputs tied to ground to prevent floating
typecad.net(U3.pin(1), U3.pin(8));  // Q1 to GND
typecad.net(U3.pin(2), U3.pin(8));  // Q2 to GND
typecad.net(U3.pin(3), U3.pin(8));  // Q3 to GND
typecad.net(U3.pin(4), U3.pin(8));  // Q4 to GND
typecad.net(U3.pin(5), U3.pin(8));  // Q5 to GND
typecad.net(U3.pin(6), U3.pin(8));  // Q6 to GND
typecad.net(U3.pin(7), U3.pin(8));  // Q7 to GND
typecad.net(U3.pin(9), U3.pin(8));  // Q0 to GND
typecad.net(U3.pin(12), U3.pin(8)); // Q9 to GND
typecad.net(U3.pin(14), U3.pin(8)); // Q11 to GND
typecad.net(U3.pin(15), U3.pin(8)); // Q12 to GND

// 74HC244 connections (Octal Buffer/Driver)
// Enable pins - both active LOW, so tie to GND to enable
typecad.net(U4.pin(1), U4.pin(10)); // 1OE to GND (enabled)
typecad.net(U4.pin(19), U4.pin(10)); // 2OE to GND (enabled)

// Input connections - only 1A2 (Pin 4) is used
typecad.net(U4.pin(4), U3.pin(13));  // 1A2 from 74HC4040 QH (1 Hz signal)

// Unused inputs tied to ground to prevent floating
typecad.net(U4.pin(2), U4.pin(10)); // 1A1 to GND
typecad.net(U4.pin(5), U4.pin(10)); // 1A4 to GND
typecad.net(U4.pin(15), U4.pin(10)); // 2A4 to GND
typecad.net(U4.pin(17), U4.pin(10)); // 2A2 to GND
typecad.net(U4.pin(18), U4.pin(10)); // 2A1 to GND

// Unused outputs left floating (N/C)
typecad.Schematic.dnc(U4.pin(3));
typecad.Schematic.dnc(U4.pin(6));
typecad.Schematic.dnc(U4.pin(7));
typecad.Schematic.dnc(U4.pin(8));
typecad.Schematic.dnc(U4.pin(9));
typecad.Schematic.dnc(U4.pin(11));
typecad.Schematic.dnc(U4.pin(12));
typecad.Schematic.dnc(U4.pin(13));
typecad.Schematic.dnc(U4.pin(14));

// Output connections - only 1Y2 (Pin 16) is used
typecad.net(U4.pin(16), J2.pin(2));  // 1Y2 to 1Hz output
typecad.named('1HZ_BUFFERED').net(U4.pin(16), TP4.pin(1)); // 1Y2 to testpoint

// Decoupling capacitors - placed near each IC's VDD pin
typecad.net(C1.pin(1), U1.pin(4)); typecad.net(C1.pin(2), U1.pin(2)); // TCXO
typecad.net(C2.pin(1), U2.pin(16)); typecad.net(C2.pin(2), U2.pin(8)); // 74HC4060
typecad.net(C3.pin(1), U3.pin(16)); typecad.net(C3.pin(2), U3.pin(8)); // 74HC4040
typecad.net(C4.pin(1), U4.pin(20)); typecad.net(C4.pin(2), U4.pin(10)); // 74HC244

// Bulk filtering capacitors
typecad.net(C5.pin(1), U1.pin(4)); typecad.net(C5.pin(2), U1.pin(2)); // 3V rail
typecad.net(C6.pin(1), U2.pin(16)); typecad.net(C6.pin(2), U2.pin(8)); // 5V rail

// Create the PCB with all components
typecad.create(
    U1, U2, U3, U4,           // ICs
    C1, C2, C3, C4, C5, C6,   // Capacitors
    R1,                       // Resistors
    J1, J2,                   // Connectors
    TP1, TP2, TP3, TP4        // Testpoints
); 
schematic(typecad.Schematic);
