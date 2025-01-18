library ieee;

use std.textio.all;

use IEEE.numeric_std.ALL;

use ieee.std_logic_1164.all;



entity lee is 
port (btn:in std_logic;
clk : in std_logic;
        led:out std_logic);
end entity lee;
architecture behave of  lee is
	signal i : integer :=0;
	signal j : std_logic :='1';
begin
	process(clk)

	begin
		if clk'event and clk='1' then
		i<=i+1;
		if i=20 then
		j<=not j;
		led<=j;
end if;
end if;
	end process;



    end behave;
