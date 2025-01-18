library ieee;
use std.textio.all;
use IEEE.numeric_std.ALL;
use ieee.std_logic_1164.all;
entity tb is
    end tb;

architecture beh of tb is   
    signal btn_tb,clk_tb: std_logic:='1';
    signal led_tb : std_logic :='0';
    signal clk_find :std_logic:='1';
    constant period : time := 500 ms;
    component lee
port (btn:in std_logic;
        clk : in std_logic;
        led:out std_logic);
        end component;
    begin
    U0: lee port map(
        btn=>btn_tb,
        led=>led_tb,
	clk=>clk_tb
    );




process
	file input_file        :text;
	variable fstatus        :file_open_status;
	variable buf            :line;
	variable temp1,temp2   :bit;
	 FILE FILE_OUT : TEXT;
        variable file_status:file_open_status;
        variable buff:LINE;
begin

 
  file_open(fstatus, input_file, "input.txt",read_mode);
	readline(input_file, buf);
	read(buf, temp1);
	btn_tb<=to_stdulogic(temp1);    
	file_close(input_file);
	wait for 200000 ns;
	        file_open(file_status,FILE_OUT,"record.txt",write_mode);
			       file_close(FILE_OUT);
			       wait for 200000 ns;	       
	file_open(file_status,FILE_OUT,"record.txt",append_mode);
	temp2:=to_bit(led_tb);
	 write(buff,temp2);
       writeline(FILE_OUT,buff);
       wait for 200000 ns;
       file_close(FILE_OUT);
end process;


process
begin
	clk_tb<='1';
	          wait for period/2;

		           clk_tb<='0';

			            wait for period/2;
			    end process;
  
			    
    end beh;
