---
title: "VIP Progress Journal - SystemVerilog Learning"
description: "Weekly progress journal documenting my journey learning SystemVerilog, including module structures, always blocks, and FSM implementations"
pubDate: 2024-08-25
author: "Xiaoyou Wu"
thumbnail: "https://picsum.photos/seed/VIP_Progress/400/300"
tags: ["Hardware & Digital Design", "Learning Journal"]
---

## Week 1: Aug 25 - Aug 31

### Foundation & Basic Structures

#### Module Structure
```systemverilog
module ModuleName (
    // Input signals
    input logic signal_name,
    input logic [31:0] bus_signal,

    // Output signals
    output logic output_signal,
    output logic [4:0] output_bus
);
    // Module body
endmodule
```

**Remember:**
- `logic` replaces wire/reg
- Bus width: `[MSB:LSB]` before signal name
- Semicolon after port list

#### Data Types
```systemverilog
// Enumerated types with explicit width
typedef enum logic [2:0] {
    NO_WRITEBACK = 3'b000,
    READ_ALU_RESULT = 3'b001,
    READ_MEM_RESULT = 3'b010
} write_back_mux_selector;

// Localparam for compile-time constants
localparam INSTR_START_PC = 0;
localparam DATA_START_PC = 127;

// Parameter extraction using bit slicing
localparam REG_S1_MSB = 19;
localparam REG_S1_LSB = 15;
```

**Number Formats:**
```systemverilog
7'h23    // 7-bit hex value
3'b001   // 3-bit binary value
32'bz    // 32-bit high-impedance
8'h00    // 8-bit hex (for byte operations)
```

#### Procedural Blocks

**Combinational - always_comb**
```systemverilog
always_comb begin
    case(alu_operator_ip)
        ALU_ADD: begin
            alu_result_op = alu_operand_a_ip + alu_operand_b_ip;
            alu_valid_op = 1;
        end
        ALU_SUB: begin
            alu_result_op = alu_operand_a_ip - alu_operand_b_ip;
            alu_valid_op = 1;
        end
        default: begin
            alu_result_op = 0;
            alu_valid_op = 0;
        end
    endcase
end
```

**Sequential - always @(posedge clk)**
```systemverilog
always @(posedge clk) begin
    if (~reset)
        cycle_count <= cycle_count + 1;
end
```

---

## Week 2: Sep 1 - Sep 7
### Advanced Patterns & Pipeline Design

#### Packages
```systemverilog
package CORE_PKG;
    // Parameters
    parameter OPCODE_STORE = 7'h23;

    // Enumerations
    typedef enum logic [6:0] {
        ALU_NOP = 7'b0000000,
        ALU_ADD = 7'b0011000
    } alu_opcode_e;

    // Custom types
    typedef enum {
        REG_A, PC, OPA_NOP
    } operand_a_mux;
endpackage
```

**Import:**
```systemverilog
import CORE_PKG::*;
```

#### Pipeline Patterns

**Signal Naming Convention**
```systemverilog
// Pass-through signals use _pt suffix
logic [31:0] id_uimmd_pt;
logic [31:0] ex_uimmd_pt;
logic [31:0] lsu_uimmd_pt;

// Stage outputs use _op suffix
output logic [31:0] alu_result_op;
output logic alu_valid_op;

// Stage inputs use _ip suffix
input logic [31:0] alu_operand_a_ip;
input logic alu_enable_ip;
```

**Pipeline Buffers**
```systemverilog
// ID to EX pipeline buffer
logic [31:0] id_instr_pc_addr_pt;
logic [31:0] ex_instr_pc_addr_pt;

// EX to MEM pipeline buffer
logic [31:0] ex_alu_result_pt;
logic ex_alu_result_valid_pt;
```

**Pipeline Control**
```systemverilog
input logic flush_en;   // Branch flush
output logic stall_op;  // Hazard stall
```

#### RISC-V Patterns

**Opcodes**
```systemverilog
parameter OPCODE_STORE = 7'h23;   // S-type
parameter OPCODE_LOAD = 7'h03;    // I-type
parameter OPCODE_BRANCH = 7'h63;  // B-type
parameter OPCODE_JAL = 7'h6f;     // J-type
parameter OPCODE_JALR = 7'h67;
parameter OPCODE_LUI = 7'h37;     // U-type
parameter OPCODE_AUIPC = 7'h17;
parameter OPCODE_OP = 7'h33;      // R-type
parameter OPCODE_OPIMM = 7'h13;
```

**Field Extraction**
```systemverilog
logic [6:0] opcode = instruction[6:0];
logic [4:0] rd = instruction[11:7];
logic [2:0] funct3 = instruction[14:12];
logic [4:0] rs1 = instruction[19:15];
logic [4:0] rs2 = instruction[24:20];
logic [6:0] funct7 = instruction[31:25];
```

---

### Interesting Knowledge base on my previous project

## Week 3: Sep 8 - Sep 14

### Testing, Synthesis & Optimization

#### Testbench

**Clock & Timing**
```systemverilog
`timescale 1ns / 1ns

module Core_tb;
    logic clk = 1;
    always #1 clk <= clk + 1;

    initial begin
        reset = 1'b1;
        #6 reset = 1'b0;
        #50 $finish;
    end
```

**Memory Init**
```systemverilog
core_proc.InstructionFetch_Module.InstructionMemory.instr_RAM[0] = 8'h00;
core_proc.InstructionFetch_Module.InstructionMemory.instr_RAM[1] = 8'h00;
core_proc.InstructionFetch_Module.InstructionMemory.instr_RAM[2] = 8'h00;
core_proc.InstructionFetch_Module.InstructionMemory.instr_RAM[3] = 8'h00;
```

**Waveform Dump**
```systemverilog
$dumpfile("Core_Simulation.vcd");
$dumpvars(0, Core_tb);
```

#### Tricks

**1. Ternary Operator**
```systemverilog
assign valid_instr_to_decode = instr_data_valid_ip ? instr_data_ip : 32'bz;
alu_result_op = ($signed(alu_operand_a_ip) < $signed(alu_operand_b_ip)) ? 1 : 0;
```

**2. Prevent Latches**
```systemverilog
always_comb begin
    // Set defaults first
    alu_operator = ALU_NOP;
    operand_a_select = OPA_NOP;
    writeback_mux = NO_WRITEBACK;

    // Then override based on conditions
    case(opcode)
        // ...
    endcase
end
```

**3. Hierarchical Access**
```systemverilog
core_proc.InstructionFetch_Module.InstructionMemory.instr_RAM[0]
```

**4. Module Instance**
```systemverilog
Core core_proc(
    .clock(clk),
    .reset(reset),
    .mem_en(mem_enable)
);
```

**5. Case with Default**
```systemverilog
case(selector)
    VALUE1: action1();
    VALUE2: action2();
    default: begin
        default_action();
    end
endcase
```

#### Synthesis Rules

**1. Assignment Types**
```systemverilog
always @(posedge clk) begin
    signal <= new_value;  // Non-blocking in sequential
end

always_comb begin
    signal = input_value;  // Blocking in combinational
end
```

**2. Sensitivity Lists**
```systemverilog
always_comb begin  // Auto-sensitive to all RHS
end
```

**3. No Latches**
- Assign in all branches
- Default case mandatory
- Initialize outputs

#### Debug

**1. Display Messages**
```systemverilog
$display("Time: %0t, PC: %h, Instruction: %h", $time, pc, instruction);
```

**2. Assertions**
```systemverilog
assert(condition) else $error("Assertion failed at time %0t", $time);
```

**3. Generate Loops**
```systemverilog
genvar i;
generate
    for (i = 0; i < 32; i++) begin : gen_loop
        assign bit_out[i] = bit_in[i] & enable;
    end
endgenerate
```

**4. Parameterized Width**
```systemverilog
module GenericModule #(
    parameter WIDTH = 32
)(
    input logic [WIDTH-1:0] data_in,
    output logic [WIDTH-1:0] data_out
);
```

**5. Width-Specified Constants**
```systemverilog
logic [31:0] data = 32'h0000_0000;  // Underscores for readability
logic [6:0] opcode = 7'b011_0011;
```

**6. Forward Declaration**

```systemverilog
logic [31:0] internal_signal;
logic control_signal;

always_comb begin
    internal_signal = input_signal + offset;
end
```

**7. Auto-sensitivity - always @(*)**

```systemverilog
always @(*) begin
    alu_operator = ALU_NOP; // Default assignment
    operand_a_select = OPA_NOP;
end
```

**8. Signed Compare**

```systemverilog
$signed(operand_a) < $signed(operand_b)  // Treat as signed values
```

## Week 3: Sep 15 - Sep 17

We decide upon the part for the add-on board

For this current board, I think I might design a four layer board. I have to correctly consider the WIFI module SPI and the level shifter, and do some entry level impedance matching.

### Common terms in selecting the part choice:

- **RoHS** stands for the **Restriction of Hazardous Substances**. It's a directive from the European Union that restricts the use of specific hazardous materials in electrical and electronic products

### Part choice

1. UJC-HP-3-SMT-TR

   - **UJC**

     - **Meaning:** This is the product series prefix. It stands for **USB Jack Connector**.

     **HP**

     - **Meaning:** This often specifies a particular feature, like **High Power** or **High Performance**. For a modern USB-C jack, this likely indicates it's designed to handle the higher power delivery standards for fast charging.

     **3**

     - **Meaning:** This number typically refers to the **USB standard** the connector is designed for. In this case, it indicates compatibility with **USB 3.x** specifications (like USB 3.1 or 3.2), which support higher data transfer speeds than older USB 2.0.

     **TR**

     - **Meaning:** This is a packaging designator that stands for **Tape and Reel**. The components are packaged in a long, pocketed tape wound onto a reel. 

2. ATWINC1500 

   - **AT:** This prefix often indicates the part originated from **Atmel**, a company that was acquired by Microchip.

     **WINC:** This designates the product family, which is Microchip's **Wireless Network Controller** lineup.

     **1500:** This is the specific model number within that family.

3. TSW-110-08-G-S

   - **TSW:** This is the series name. It stands for "**T**hrough-hole **S**trip, .025" S**q**uare Post". This tells you it's a standard pin header designed to go through holes in a PCB.

     **110:** This segment defines the number of pins per row. `1` indicates it's a single-row header, and `10` means it has **10 pins** in that row.

     **08:** This code specifies the lead style and plating. `08` is a common style for standard through-hole headers.

     **G:** This indicates the plating material, which is **gold**. Specifically, it's 10 µ" of gold on the contacts, which provides good conductivity and corrosion resistance.

     **S:** This last part defines the row configuration. `S` means it is a **single-row** header. If it were a dual-row header, it would have a `D`.

4. TXS0108EPWR

   - **TXS:** This prefix identifies the product family, which are voltage-level **translators** with auto-direction sensing.

     **01:** This often indicates the technology generation or a specific feature set within the family.

     **08:** This number specifies that the chip has **8 channels**, meaning it can translate eight separate signal lines at once.

     **E:** This letter indicates that the part is an "enhanced" or updated product.

     **PWR:** This suffix describes the packaging. `PW` specifies the **TSSOP** (Thin Shrink Small Outline Package), and `R` means it's supplied on **Tape & Reel** for automated manufacturing.

5. CP2102N-A02-GQFN24R

   - **CP2102N:** This is the base model number. The 'N' signifies it's part of the newer, more advanced generation of this popular chip.

     **A02:** This indicates a specific revision of the chip, which often includes minor bug fixes or feature updates from the original `A01` version.

     **GQFN24:** This describes the physical package of the chip. **QFN** (Quad Flat No-leads) is a very compact, square package with 24 pins that are pads on the bottom, not traditional "legs" sticking out.

     **R:** This final letter indicates the part is supplied on **Tape & Reel**, which is standard for automated manufacturing.

6. KUSBX-AS1N-B

   - **KUSBX:** This is the series name from Kycon for their line of USB connectors.

     **A:** Specifies that it's a **USB Type-A** connector.

     **S:** Indicates that it's a **plug** (the male half).

     **1N:** Defines the mounting style, which is **through-hole** with a standard horizontal orientation.

     **B:** Specifies the shell type, which in this case is a standard one-piece metal shell.

### Design experiences from my previous PCB project

1. Route the WIFI first, and the UART, for its the high speed route.
2. Modify the Rule checks for proper impedance matching
3. Make sure the layout first.

