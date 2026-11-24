# Sources of the own engine's citations

A comment in `engines/ratchet/` cites the implementation a function follows, and the one it rejected, as engine,
revision and symbol: `Ethereal 12.75 LateMovePruningCounts`. `FEATURES.md` cites each feature's dated implementations
the same way. This table maps each cited engine and revision to its public source: a repo and an exact commit, or an
archive and its sha256. A revision is a commit prefix or a release's version; a version's row names its tag. A
disputed clone's row says so; a citation of it names the program it is assumed to copy.
`bun tools/citations.ts` lists the citations this table does not resolve.

| engine | revision | repo | commit | tag |
|---|---|---|---|---|
| Alexandria | 829daf4 | https://github.com/PGG106/Alexandria | 829daf405eb18c93b4e941802e8ecea0688b3a0d | - |
| Amy | 0.8.7 | amy-0.8.7.tar.gz, Wayback copy of tgreiner.net: https://web.archive.org/web/20060519210948id_/http://www.tgreiner.net:80/amy-0.8.7.tar.gz | sha256:66cf918caa87b7818613fceafeba428fe02c2d1d8c41591e98e3921436e2e6e3 | - |
| Arasan | 1.0 | arasan2.zip, the author's old-downloads page: https://arasanchess.org/arasan2.zip | sha256:0ea3cbc287b0f880a3e55d0e7bb51d6650d077bb2ab840b31964e782fed22f7e | - |
| Awit | 1986 | awit.pdf, Marsland's Algol W listing: the 1986 original, adapted in 2008 for the AW2C converter, linked from the Chess Programming Wiki's Awit page: https://www.chessprogramming.org/Awit | sha256:8179c89064c4c7c4e6b1d7efd46b134f932d972945008a44c0ccbefb4129333f | - |
| Berserk | 03cebd6 | https://github.com/jhonnold/berserk | 03cebd65a72100d45073cfe626796676256c14d3 | - |
| Berserk | 787b2e1b | https://github.com/jhonnold/berserk | 787b2e1bfa5a363860f1a4ed52c67910188ec681 | - |
| Berserk | d7e1f05 | https://github.com/jhonnold/berserk | d7e1f0504589e3b89b43a424fb69d55e63eefda8 | - |
| Berserk | f05f9dc | https://github.com/jhonnold/berserk | f05f9dc5261eb4ac0e667795507096c62617589e | - |
| Berserk | fe1363a | https://github.com/jhonnold/berserk | fe1363af6b5b3c2e27b6eb3916a409db49eaccb5 | - |
| Blitz | 6.9 | Blitz69.zip, Hyatt's OCR of the printed listing, on the Chess Programming Wiki: https://www.chessprogramming.org/File:Blitz69.zip | sha256:98e7cdde7d3fcdd943c6d825235adbe21ac657c33853e289803088690a19b078 | - |
| Chess | 0.5 | Chess05.pas, Scott A. Moore's transcription of the BYTE 1978 listing, Wayback copy of moorecad.com: https://web.archive.org/web/20250111025101id_/https://www.moorecad.com/standardpascal/Chess05.pas | sha256:a3bdf18ec3b262a2478b5604bd7f8a02896a7dd7a4a5fa2e907719fdc7a93fa6 | - |
| Chess | 4.6 | Chess 4.6 source listing, Computer History Museum: http://archive.computerhistory.org/projects/chess/related_materials/software/3-3.Chess_4.6_Sourcecode.102645430/chess_4-6.sourcecode.102645430.pdf | sha256:918dca91419fa0d9702544414af239d7d0bf87da0e0bd1070997decdbf4d641d | - |
| Clockwork | 04f2f0e | https://github.com/official-clockwork/Clockwork | 04f2f0ec556d8bee2929b194ab1d6f35e34a98c2 | - |
| Clockwork | 26eccaa | https://github.com/official-clockwork/Clockwork | 26eccaa7580ddf60d522a9282d4b039360faff16 | - |
| Clockwork | 3dd022c | https://github.com/official-clockwork/Clockwork | 3dd022c95847be70352dcb1697d4e7582773de03 | - |
| Clockwork | 641d9f5 | https://github.com/official-clockwork/Clockwork | 641d9f54d681b33b5858c1a29fec96af907c8278 | - |
| Clockwork | 662c568 | https://github.com/official-clockwork/Clockwork | 662c568a99ed4bb8d31c77515ba6470bd8fa034b | - |
| Clockwork | 6bf993b | https://github.com/official-clockwork/Clockwork | 6bf993bec75bf4bcb96f0e4446fff908f9714e5f | - |
| Clockwork | 8ee523a | https://github.com/official-clockwork/Clockwork | 8ee523ac768fbc75eafdfdeb2d6318f26edc5dd4 | - |
| Clockwork | 958d0d0 | https://github.com/official-clockwork/Clockwork | 958d0d031cadfa35c95108865561b98c6d92e23d | - |
| Clockwork | bedb1e8 | https://github.com/official-clockwork/Clockwork | bedb1e8b26fb28c64a6c506d9bec12613983c14c | - |
| Clockwork | e774be4 | https://github.com/official-clockwork/Clockwork | e774be4d5cfe5d3420c8cbb432a5171bc4ab9224 | - |
| Clockwork | f236181 | https://github.com/official-clockwork/Clockwork | f23618124cadc0c54bb3100ac1a46bec66e6e6e2 | - |
| Crafty | 10.18 | crafty-10.18.zip, Wayback copy of craftychess.com: https://web.archive.org/web/20170315063634id_/http://craftychess.com/downloads/source/crafty-10.18.zip | sha256:f97b81ca3189db5ada3f7aef4769b9c1f940fd0666b07045ce47f304214a3aeb | - |
| Cray Blitz | 49h | https://github.com/swenson/cray-blitz (from craftychess.com; its README dates the source 12/09/90, and its routines' revision stamps run to 09/14/91) | 78a009e3d5b73db2100f17032326cccc393ebb35 | - |
| Ethereal | 013ca36 | https://github.com/AndyGrant/Ethereal | 013ca368ae57fef8b6b79bb01bd23f31f9143e46 | - |
| Ethereal | 05c2457 | https://github.com/AndyGrant/Ethereal | 05c24579c2e72722d9a8fce25cb891582f902ce3 | - |
| Ethereal | 0e47e9b | https://github.com/AndyGrant/Ethereal | 0e47e9b67f345c75eb965d9fb3e2493b6a11d09a | - |
| Ethereal | 12.75 | https://github.com/AndyGrant/Ethereal | b55ed96881f163940569145fbcc4e222d7272338 | v12.75 |
| Ethereal | 1eff740 | https://github.com/AndyGrant/Ethereal | 1eff740950c4fb25e223f9f6363be62ded70bd27 | - |
| Ethereal | 311d110 | https://github.com/AndyGrant/Ethereal | 311d11023497ed0575ee5d188ea0aaaec1ed14a8 | - |
| Ethereal | 341c43f | https://github.com/AndyGrant/Ethereal | 341c43f0bf88d68d5f7389db0477287c937f6a99 | - |
| Ethereal | 60f4d5c | https://github.com/AndyGrant/Ethereal | 60f4d5c58672aac237bf65aa6d00363c25f99734 | - |
| Ethereal | 9050afb | https://github.com/AndyGrant/Ethereal | 9050afbd93c505e367f792dea09090672cf00e5d | - |
| Ethereal | aa3bc68 | https://github.com/AndyGrant/Ethereal | aa3bc6833530b52b7496203ba0520ee0e8dc05cd | - |
| Ethereal | bd96fb9 | https://github.com/AndyGrant/Ethereal | bd96fb9ea7758629e5abea28ddcad528c7c0d8ac | - |
| Ethereal | df2d953 | https://github.com/AndyGrant/Ethereal | df2d9537fe381d5bafd2f46492be999685eb0788 | - |
| Ethereal | f71ac47 | https://github.com/AndyGrant/Ethereal | f71ac4769a4c9850782c02b6987f7e0187c0223f | - |
| Ethereal | fcb6f77 | https://github.com/AndyGrant/Ethereal | fcb6f774674fbe1554a12534a64a2c3353d68a76 | - |
| Fruit | 1.0 | fruit_10.zip, Wayback copy of WBEC Ridderkerk: https://web.archive.org/web/20120708151511id_/http://wbec-ridderkerk.nl/html/downloada/fruit/fruit_10.zip | sha256:3720c6959fba13c99f7e46421f13a2f35f33b8768a4e0adc5609b31fe3c98d0d | - |
| Fruit | 2.0 | fruit_20upd.rar, WBEC's updated distribution, Wayback copy of WBEC Ridderkerk: https://web.archive.org/web/20120710211433id_/http://wbec-ridderkerk.nl/html/downloada/fruit/fruit_20upd.rar | sha256:90f31804694a97245e0ed00223b8f23eaa754b59283af4618198dbc5227b9194 | - |
| Fruit | 2.1 | fruit_21.zip, WBEC Ridderkerk (inventory/fruit-2.1.md) | sha256:45112b37d0c31db931d9d1c941dfbb9d0f453aec32ed27eb8afbaf3f75b4a7e2 | - |
| Glaurung | 1.0.2 | glaurung102-src.tar.gz, Wayback copy of glaurungchess.com: https://web.archive.org/web/20060506122208id_/http://www.glaurungchess.com:80/glaurung102-src.tar.gz | sha256:c8f1e4cb5936acb1e4cbc69374b59d77ab6728bac7bf4d2255f69c8673883245 | - |
| Glaurung | Mainz | mainz-src.tar.gz, Wayback copy of glaurungchess.com: https://web.archive.org/web/20051102063744id_/http://www.glaurungchess.com:80/mainz-src.tar.gz | sha256:c06009121e325722ee5ecc83aa6b56e44f02835e010e05c23d72491fafce42db | - |
| Glaurung | g070804 | g070804.tar.gz, a 2.0 beta, Wayback copy of glaurungchess.com: https://web.archive.org/web/20070812024045id_/http://www.glaurungchess.com/beta/g070804.tar.gz | sha256:0ce60212b2fe7c7ad5771eca84cd0c9558dd1edc747d06de69f37eff67125147 | - |
| Glaurung | g071001 | g071001-src.tar.gz, a 2.0 beta, Wayback copy of glaurungchess.com: https://web.archive.org/web/20071001171551id_/http://www.glaurungchess.com/beta/g071001-src.tar.gz | sha256:4f939de16f4ce711a2ad556a5e94fa1f39dc1a74132c8eaa733ebb48fc8dd770 | - |
| GNU Chess | 4.0.74 | gnuchess 4.0 patchlevel 74, Debian snapshot: https://snapshot.debian.org/file/deccaa10cbae3a5bec284b42a2e8356a4937b7c1 | sha256:809f047b1bcf0a41815f413531430e3bed51525faff35c9c3e3f81e2a140cd8b | - |
| Incipit | be29d4f | https://github.com/adamtwiss/incipit | be29d4f32f9abc720c92e0ef45dc5d318f85b808 | - |
| IPPOLIT | 2009 | IPPOLIT.c, Wayback copy of ippolit.wikispaces.com; a disputed clone, assumed Rybka 3: https://web.archive.org/web/20100316040725id_/http://ippolit.wikispaces.com:80/file/view/IPPOLIT.c/74307253/IPPOLIT.c | sha256:f5ed3bbccae3a0eecea2d58b33d484074999848069516ede4c5d1f54351322d8 | - |
| Koivisto | 2bce075 | https://github.com/Luecx/Koivisto | 2bce0753224ab66c40cabefa23f83f9baca4696c | - |
| Koivisto | 51747be9 | https://github.com/Luecx/Koivisto | 51747be9f239e611d60e1b736cd6ef8589041338 | - |
| Laser | 1.7 | https://github.com/jeffreyan11/laser-chess-engine | 96bfbdba8d064442626e1bb23e02473a46559a2e | v1.7 |
| Lynx | 1d3047b5 | https://github.com/lynx-chess/Lynx | 1d3047b533e66196d9ee1e620eec52994b77e591 | - |
| Lynx | 21a3016e | https://github.com/lynx-chess/Lynx | 21a3016e8fce819385c1f3b733bae40f742af53e | - |
| Lynx | 8940a21e | https://github.com/lynx-chess/Lynx | 8940a21eb4cb11c2c97da09853477bc47316fcb9 | - |
| Phalanx | XII | phalanx_12.orig.tar.gz, Debian snapshot: https://snapshot.debian.org/file/476fdfcdb5a1b45c3f1ba1509541c23088cccfa2 | sha256:16c1727e00265fccdf219afabd34be47425836333d1179e5a478ec686a56ff37 | - |
| Sargon | 1978 | retro-sargon, Bill Forster's transcription of the 1978 listing: https://github.com/billforsternz/retro-sargon | a0be0d2936a7459970215bc43fbdc59f9682bd66 | - |
| Stash | 007850d | https://github.com/mhouppin/stash-bot | 007850df35d51bdad46a011fcd08f0d1c8687f6f | - |
| Stash | 079fcba | https://github.com/mhouppin/stash-bot | 079fcbabe9d74851640ee55e7654e0915f846c4b | - |
| Stash | 13ac9e7 | https://github.com/mhouppin/stash-bot | 13ac9e77bb364684becd2cecb7b09f2aafc89c30 | - |
| Stash | 302136d | https://github.com/mhouppin/stash-bot | 302136d09eaec4c0635178ad59e3290386289298 | - |
| Stash | 37 | https://github.com/mhouppin/stash-bot | 077a93828fee354853ffac322f178d1a4f1670ff | v37.0 |
| Stash | 4f1ccc1 | https://github.com/mhouppin/stash-bot | 4f1ccc1016eaaccbc360e762e25b0a82e8cec89c | - |
| Stash | 660df34 | https://github.com/mhouppin/stash-bot | 660df349038e27c980c311cbcac412308765af41 | - |
| Stash | 767fdb1 | https://github.com/mhouppin/stash-bot | 767fdb17c3f5cd364c84caa17080fc98a03dff2e | - |
| Stash | 8546bfe | https://github.com/mhouppin/stash-bot | 8546bfe2be0a6bd22db481d0a10a6e076975b63e | - |
| Stash | 93a6d5f | https://github.com/mhouppin/stash-bot | 93a6d5f655775ad3d0043c72a1640c6e11c0bbb9 | - |
| Stash | ba73642 | https://github.com/mhouppin/stash-bot | ba7364278c17a86b4fc5d16dde7ba30072e0eb30 | - |
| Stash | dcc25ed | https://github.com/mhouppin/stash-bot | dcc25ed60c4a74fe7b008525469f8e1f599c0ec7 | - |
| Stash | ea9fd72 | https://github.com/mhouppin/stash-bot | ea9fd72f902726015165ccd3ade51b29c8bd50a9 | - |
| Stash | f91e750 | https://github.com/mhouppin/stash-bot | f91e7502d9343b613402e2e2aa0193b61cdb5683 | - |
| Stockfish | 05a8c318 | https://github.com/official-stockfish/Stockfish | 05a8c318b8cfc284906f6077fd934d35d891028c | - |
| Stockfish | 074c7a3c | https://github.com/official-stockfish/Stockfish | 074c7a3c30dce46b65bc7deb15619a6a33ecf4a8 | - |
| Stockfish | 10 | https://github.com/official-stockfish/Stockfish | b4c239b625285307c5871f1104dc3fb80aa6d5d2 | sf_10 |
| Stockfish | 11 | https://github.com/official-stockfish/Stockfish | c3483fa9a7d7c0ffa9fcc32b467ca844cfb63790 | sf_11 |
| Stockfish | 13c11f40 | https://github.com/official-stockfish/Stockfish | 13c11f40480ec97316bd4da3a53787cc871037ea | - |
| Stockfish | 15 | https://github.com/official-stockfish/Stockfish | e6e324eb28fd49c1fc44b3b65784f85a773ec61c | sf_15 |
| Stockfish | 17 | https://github.com/official-stockfish/Stockfish | e0bfc4b69bbe928d6f474a46560bcc3b3f6709aa | sf_17 |
| Stockfish | 19 | https://github.com/official-stockfish/Stockfish | edb0d9db6731067ec50ce619ff372b463bc4dd5d | sf_19 |
| Stockfish | 16836f39 | https://github.com/official-stockfish/Stockfish | 16836f39b295ec635c9883498400f7006ac2869f | - |
| Stockfish | 18b08096 | https://github.com/official-stockfish/Stockfish | 18b08096399c0e316baa1999f8cc6ce56bc7f616 | - |
| Stockfish | 1d09ee70 | https://github.com/official-stockfish/Stockfish | 1d09ee70f7da1f9aa60c7ff97a35881327f69a03 | - |
| Stockfish | 219fa2f0 | https://github.com/official-stockfish/Stockfish | 219fa2f0a79381d35d9eb1240781cc598e74f647 | - |
| Stockfish | 23493de0 | https://github.com/official-stockfish/Stockfish | 23493de08272226394fb69c4f31182b48b0e739e | - |
| Stockfish | 314faa90 | https://github.com/official-stockfish/Stockfish | 314faa905a60962595d610c26727c4b603c6ed62 | - |
| Stockfish | 31d4f0b7 | https://github.com/official-stockfish/Stockfish | 31d4f0b73430677e79873beef16830dc07857ddd | - |
| Stockfish | 3af083a7 | https://github.com/official-stockfish/Stockfish | 3af083a7cd9be1659f1d8a39a65e33b87608f762 | - |
| Stockfish | 43e100ae | https://github.com/official-stockfish/Stockfish | 43e100ae06376d63461005422f26e5517db07c6d | - |
| Stockfish | 45e5e65a | https://github.com/official-stockfish/Stockfish | 45e5e65a28ce7e304c279fabf5f8a83cced73013 | - |
| Stockfish | 4739037f | https://github.com/official-stockfish/Stockfish | 4739037f967ac3c818907e89cc88c7b97021d027 | - |
| Stockfish | 4bc11984 | https://github.com/official-stockfish/Stockfish | 4bc11984fc5a148ee8f1b55d6ac47c4a397cc8b8 | - |
| Stockfish | 4eca981e | https://github.com/official-stockfish/Stockfish | 4eca981e557704f4ce3db829adf380b8fc058926 | - |
| Stockfish | 5ae195ee | https://github.com/official-stockfish/Stockfish | 5ae195ee7e3ccac01b8145f9b7022e352a288f07 | - |
| Stockfish | 5b2fc1e1 | https://github.com/official-stockfish/Stockfish | 5b2fc1e1c06d8348efb4bf45bac9c8f4916fd01c | - |
| Stockfish | 5ee16a18 | https://github.com/official-stockfish/Stockfish | 5ee16a180a7eb3f51f7cabd86cf17d8c217b13b3 | - |
| Stockfish | 67818ee9 | https://github.com/official-stockfish/Stockfish | 67818ee9481ba99369fa8a8d92e5c50428fb300e | - |
| Stockfish | 69d3be42 | https://github.com/official-stockfish/Stockfish | 69d3be42a112645a9e599df615f730d61a5dca8c | - |
| Stockfish | 6b782211 | https://github.com/official-stockfish/Stockfish | 6b7822119feffd0a27ae5b2a95d3570c9e046090 | - |
| Stockfish | 71cc01c2 | https://github.com/official-stockfish/Stockfish | 71cc01c2ef45bab91bdcd72c699f66e19dd518b3 | - |
| Stockfish | 7225d254 | https://github.com/official-stockfish/Stockfish | 7225d254f90c7b9d64d4adf85ec2d319c6cf75a0 | - |
| Stockfish | 77b4f4c2 | https://github.com/official-stockfish/Stockfish | 77b4f4c2e735a3f1173d74ce904db9dae262a682 | - |
| Stockfish | 7cdd5e89 | https://github.com/official-stockfish/Stockfish | 7cdd5e89a39fe3071b67d91c7bb07d712044bf76 | - |
| Stockfish | 7f2c8a2b | https://github.com/official-stockfish/Stockfish | 7f2c8a2b81af19033a62845408b7ae19ed513053 | - |
| Stockfish | 7f300a76 | https://github.com/official-stockfish/Stockfish | 7f300a769848c695fb28da444b0c3f4c1d919945 | - |
| Stockfish | 8c3d9d99 | https://github.com/official-stockfish/Stockfish | 8c3d9d996af7aa34f019785818eecbeb9338b95f | - |
| Stockfish | 8fd34d77 | https://github.com/official-stockfish/Stockfish | 8fd34d7763072fc3ec7216729c1f7b7354bfa470 | - |
| Stockfish | 91a76331 | https://github.com/official-stockfish/Stockfish | 91a76331ca27b40d63f0031fbd7b9e41ead354d4 | - |
| Stockfish | 946fa476 | https://github.com/official-stockfish/Stockfish | 946fa4762539307dcdcb30d08f13d627864e9bcf | - |
| Stockfish | 97d2cc9a | https://github.com/official-stockfish/Stockfish | 97d2cc9a9c1c4b6ff1b470676fa18c7fc6509886 | - |
| Stockfish | 9dbb3ae8 | https://github.com/official-stockfish/Stockfish | 9dbb3ae8b2c5ef4ad2b399a42707ad1fd851c68b | - |
| Stockfish | 9eb7b607 | https://github.com/official-stockfish/Stockfish | 9eb7b607cf69f6b613c89ae767b7f934f26e59e1 | - |
| Stockfish | a273b6ef | https://github.com/official-stockfish/Stockfish | a273b6ef8c899f546cf585ace584a1b498c04144 | - |
| Stockfish | a32d2086 | https://github.com/official-stockfish/Stockfish | a32d2086bc227f1d76bd04808e10c8e7bd230fe9 | - |
| Stockfish | a91cb9fc | https://github.com/official-stockfish/Stockfish | a91cb9fc1bc403dd610b3e17f022b5afa94dff49 | - |
| Stockfish | ad87d707 | https://github.com/official-stockfish/Stockfish | ad87d707fffeeac9aa1ae3e3e8d6fa2449ea1df9 | - |
| Stockfish | b0658f09 | https://github.com/official-stockfish/Stockfish | b0658f09b93185e2b43d4b2d6f0daa30c36ebcc2 | - |
| Stockfish | b3868562 | https://github.com/official-stockfish/Stockfish | b38685625af42b9ef96a9f964062d63fe0b3d027 | - |
| Stockfish | b40e45c1 | https://github.com/official-stockfish/Stockfish | b40e45c1cc51bd228898314264d6d241478b23d8 | - |
| Stockfish | b5a4edd8 | https://github.com/official-stockfish/Stockfish | b5a4edd86f1a64a6308ea3eaa05d944a7ef817bb | - |
| Stockfish | b7b7a3f3 | https://github.com/official-stockfish/Stockfish | b7b7a3f3fa786449832bd84d501c1183290f3e3a | - |
| Stockfish | bae019b5 | https://github.com/official-stockfish/Stockfish | bae019b53e5c2bfcf0d69b4ebfc52b4f4de762eb | - |
| Stockfish | bb751d6c | https://github.com/official-stockfish/Stockfish | bb751d6c890f5c50c642366d601740366cfae8d0 | - |
| Stockfish | bf2c7306 | https://github.com/official-stockfish/Stockfish | bf2c7306ac7f83200ba4d894867e3c0c78c0802c | - |
| Stockfish | c216dcbe | https://github.com/official-stockfish/Stockfish | c216dcbe7bfc5e326d260d1b7c1271fb4ffc67c9 | - |
| Stockfish | c228f319 | https://github.com/official-stockfish/Stockfish | c228f3196ae9965250f317c8784012c2485228c4 | - |
| Stockfish | c7194bd9 | https://github.com/official-stockfish/Stockfish | c7194bd924a606ab75d582d30cb41749312ea94e | - |
| Stockfish | c99d963f | https://github.com/official-stockfish/Stockfish | c99d963fa54ad1af375c796632ada34bd0cf2a29 | - |
| Stockfish | cc54a91c | https://github.com/official-stockfish/Stockfish | cc54a91ca508e68bf84715a50f84c79f66b8f109 | - |
| Stockfish | ccd823a4 | https://github.com/official-stockfish/Stockfish | ccd823a4ffd2ed3e60cb03ab49a841742bae1994 | - |
| Stockfish | d0804341 | https://github.com/official-stockfish/Stockfish | d0804341c5ec422c19e34db20756d123d03464e0 | - |
| Stockfish | d1ec10cd | https://github.com/official-stockfish/Stockfish | d1ec10cd4fe1e67114178f444cfebd2ff1183408 | - |
| Stockfish | d40d04c1 | https://github.com/official-stockfish/Stockfish | d40d04c17ceadff6f15d1cb1d4d469f823a35a02 | - |
| Stockfish | db59696a | https://github.com/official-stockfish/Stockfish | db59696aaf91641ade911c4a6ca393a1691d78a8 | - |
| Stockfish | e4f8a4fa | https://github.com/official-stockfish/Stockfish | e4f8a4fa7f5da8287579c0c74e292974c6acfd8d | - |
| Stockfish | e64b9572 | https://github.com/official-stockfish/Stockfish | e64b957274b94e89ad1a6e3ec4571c9082246a0a | - |
| Stockfish | f2430bf0 | https://github.com/official-stockfish/Stockfish | f2430bf034cc31258c870797501bce0605bce3d0 | - |
| Stockfish | fca0a2dd | https://github.com/official-stockfish/Stockfish | fca0a2dd881e6bde0a01d3342dd385600e01730b | - |
| Tech II | 614 | chess2.614, the PDP-10/its repo at f2d00b83: https://raw.githubusercontent.com/PDP-10/its/f2d00b83d7405c647547eb82e284aa66f3e3da69/src/rg/chess2.614 | sha256:7950713c1c5516899aa509b99cd6923247c209d7a2bbeb09895b0820a3f17c89 | - |
| Toga II | 1.2.1a | https://github.com/zwegner/toga-mp | 8d2be3a8319266cc88d6bd5b823317675afc92e6 | - |
| Weiss | 073eda5 | https://github.com/TerjeKir/weiss | 073eda51162ee2bdc9b930520d993c516873d02c | - |
| Weiss | 0d00a00 | https://github.com/TerjeKir/weiss | 0d00a00609309e8348284cb615b4f9a1899a69f0 | - |
| Weiss | 11a0f72 | https://github.com/TerjeKir/weiss | 11a0f72052eec6d8c02e5a11a99658e42c18bbe4 | - |
| Weiss | 1401211 | https://github.com/TerjeKir/weiss | 14012110db757c452bc086cc0a9262dda8c3af2c | - |
| Weiss | 2.0 | https://github.com/TerjeKir/weiss | 0db49c7270f5c6286a983390a5ea2780e1e0c9f4 | v2.0 |
| Weiss | 20c95ce | https://github.com/TerjeKir/weiss | 20c95ce87fed07430f0e9f31ef91e07612fb055d | - |
| Weiss | 216d6c1 | https://github.com/TerjeKir/weiss | 216d6c184cf1fb0cd8c727140ea28f42af13760d | - |
| Weiss | 2568fb7 | https://github.com/TerjeKir/weiss | 2568fb7ad28554f762c41c01c96e52f237533c2d | - |
| Weiss | 2a3f84c | https://github.com/TerjeKir/weiss | 2a3f84ca070b527f9157c6a347fe7143d0511cc8 | - |
| Weiss | 3e95de9 | https://github.com/TerjeKir/weiss | 3e95de966decd29df00d0c73c5a44cda8454f60b | - |
| Weiss | 3f9eb09 | https://github.com/TerjeKir/weiss | 3f9eb096a9c26158a43df3f5095cbcd8727644d8 | - |
| Weiss | 4024a5e | https://github.com/TerjeKir/weiss | 4024a5ef54ea29fc48d16da70241ff398c297fb3 | - |
| Weiss | 5168a50 | https://github.com/TerjeKir/weiss | 5168a50e2ffa27675ce302547a9a3b5b24520430 | - |
| Weiss | 693b322 | https://github.com/TerjeKir/weiss | 693b322a0ba6f39566f5a5a4a7e82b0a8784f04f | - |
| Weiss | 7608ca3 | https://github.com/TerjeKir/weiss | 7608ca3a7f3a90f5f075b47ddfefd479ed2ff522 | - |
| Weiss | 7a05d2f | https://github.com/TerjeKir/weiss | 7a05d2f20ea4c2b177417e1bfbdbd8250d46c4ef | - |
| Weiss | 95b0951 | https://github.com/TerjeKir/weiss | 95b0951bcca19e64f6b4dc81e3270f3a67b64f8f | - |
| Weiss | a7d7783 | https://github.com/TerjeKir/weiss | a7d778395feda3a25358b1af63a52f06cdaf981d | - |
| Weiss | b65b91e | https://github.com/TerjeKir/weiss | b65b91e848a7caae3b396e8592c426d786361042 | - |
| Weiss | c735b8f | https://github.com/TerjeKir/weiss | c735b8f3d2ddb0cdf42b135a5fb42e21c01f7a3d | - |
| Weiss | d7d1334 | https://github.com/TerjeKir/weiss | d7d133426e1f8ae862021571ea2a636b0d151f07 | - |
| Weiss | e9021fb | https://github.com/TerjeKir/weiss | e9021fb29c713a79bf69342e3828faf1670ca819 | - |
| Weiss | fe8e513 | https://github.com/TerjeKir/weiss | fe8e513bc8f58739524e6d0b43ddc9bdf0005b05 | - |
| Xiphos | 0.6 | https://github.com/milostatarevic/xiphos | e7ba1a4d44a59c3fa076666a3814f2487153a8a5 | v0.6 |
| Xiphos | 1f57b81 | https://github.com/milostatarevic/xiphos | 1f57b817a6b5aaeeb00a56b83c5656f0b6103cf1 | - |
