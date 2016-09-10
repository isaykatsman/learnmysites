1) Davis, Mike. The Origins of the Third World: Markets, States and Climate. The Corner House, 2002. Print. 

2) Davis argues that the third world originated due to European exploitation for resources.

3) Main points:

Also, Davis argues that social injustice is rather prevalent in the third world.
In addition, he makes it clear that additional injustices are present
4) The article relates to the McMichael chapter because it ties in with key ideas of the Development Theory timeline. Namely, the colonial period of the Development timeline ties directly in with how the European countries were coming in to "civilize" the third world countries and how they began to quickly exploit them for resources. This is well argued by Davis in this section.

5) In the future, will it be possible to somehow develop the third world to the point were it is advanced enough to be considered part of the first world, while still serving as a place for so-called "first world manufacturing"? What would be the consequences of every country being in the first world?

6) One quote "ecological poverty, especially the decline of irrigation and the enclosure of common resources" (Davis 2) demonstrated that resource usage took a significant toll on the third world. This is significant because it shows how when one part of the world thrives and actively develops, just how much of a toll this can take on the third world. In general, I think this is very symbolic of what is going on in general - the wealthy profit at the expense of degrading those that work for them. 


part 6)

let step (config : config) : config =

{
refl = config.refl;
pb = config.pb;
rotors = f config.rotors;
}

let f rotors: o_r list = List.rev (step_rotors (List. rev rotors) true)

let step_rotors rotors carry: bool = 
match rotors with 
| [] -> []
| h::[] -> (if carry then step_only h else h)
| h::t -> (if (carry || turnover) then (step_only h) else h)::(step_rotors t turnover(whether h is at turnover));;

test:

 cipher_char {refl="YRUHQSLDPXNGOKMIEBFZCWVJAT";rotors=[{rotor={wiring="EKMFLGDQVZNTOWYHXUSPAIBRCJ";turnover='A'};top_letter='A'};{rotor={wiring="AJDKSIRUXBLHWTMCQGZNPYFVOE";turnover='A'};top_letter='A'};{rotor={wiring="BDFHJLCPRTXVZNYEIWGAKMUSQO";turnover='A'};top_letter='A'}];plugboard=[]} 'P';;