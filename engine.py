import json
import os
import requests
import urllib3
import re

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class TFTDecisionEngine:
    def __init__(self, space_gods_path="set17_space_gods.json", meta_comps_path="set17_meta_comps.json"):
        with open(space_gods_path, 'r', encoding='utf-8') as f:
            self.db = json.load(f)
            
        self.champions = {c['apiName']: c for c in self.db['champions']}
        self.traits = {t['apiName']: t for t in self.db['traits']}
        
        self.name_translation_index = {}
        for api_name, data in self.champions.items():
            clean_name = re.sub(r'[^a-zA-Z0-9]', '', data['name'].lower())
            self.name_translation_index[clean_name] = api_name

        self.meta_comps_path = meta_comps_path
        self.meta = self.fetch_live_meta_tierlist()

    def translate_to_api_name(self, raw_name):
        clean_key = re.sub(r'[^a-zA-Z0-9]', '', raw_name.lower())
        return self.name_translation_index.get(clean_key, None)

    def fetch_live_meta_tierlist(self):
        print("[Scraper] Fetching latest Set 17 meta configurations...")
        live_endpoint = "https://raw.githubusercontent.com/tft-community/meta-deck/main/set17_comps.json"
        
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            response = requests.get(live_endpoint, headers=headers, timeout=5)
            
            if response.status_code == 200:
                raw_comps = response.json()
                parsed_comps = []
                
                for comp in raw_comps.get("compositions", []):
                    translated_units = []
                    for unit in comp.get("units", []):
                        api_name = self.translate_to_api_name(unit)
                        if api_name:
                            translated_units.append(api_name)
                    
                    if len(translated_units) > 0:
                        parsed_comps.append({
                            "id": comp.get("id"),
                            "name": comp.get("name"),
                            "tier": comp.get("tier", "A"),
                            "base_win_rate": comp.get("win_rate", 0.50),
                            "core_units": translated_units,
                            "carries": [self.translate_to_api_name(u) for u in comp.get("carries", []) if self.translate_to_api_name(u)],
                            "tanks": [self.translate_to_api_name(u) for u in comp.get("tanks", []) if self.translate_to_api_name(u)],
                            "flex_units": [self.translate_to_api_name(u) for u in comp.get("flex", []) if self.translate_to_api_name(u)]
                        })
                
                return {"meta_compositions": parsed_comps}
                
        except Exception as e:
            print(f"[Scraper] Live fetch bypassed ({e}). Loading local configurations.")
            
        if os.path.exists(self.meta_comps_path):
            with open(self.meta_comps_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"meta_compositions": []}

    def calculate_optimal_items(self, champ_api_name):
        champ = self.champions.get(champ_api_name)
        if not champ:
            return []

        role = champ.get("role")
        stats = champ.get("stats", {})
        max_mana = stats.get("mana", 0)
        range_val = stats.get("range", 1.0)
        attack_speed = stats.get("attackSpeed", 0.7)

        items = []

        if role in ["APTank", "ADTank"] or (role is None and range_val <= 1.0):
            items = ["Warmog's Armor", "Gargoyle Stoneplate", "Dragon's Claw"]
            if stats.get("armor", 40.0) > stats.get("magicResist", 40.0):
                items[2] = "Bramble Vest"
            return items

        elif role == "APCaster":
            items.append("Spear of Shojin" if max_mana >= 80 else "Blue Buff")
            items.append("Jeweled Gauntlet")
            items.append("Rabadon's Deathcap")
            return items

        elif role in ["ADCarry", "ADSpecialist"]:
            items.append("Guinsoo's Rageblade" if attack_speed >= 0.8 or range_val >= 5.0 else "Deathblade")
            items.append("Infinity Edge")
            items.append("Last Whisper")
            return items

        elif role in ["ADFighter", "APReaper", "ADReaper", "HFighter"]:
            items.append("Bloodthirster")
            if role == "APReaper":
                items.append("Hand of Justice")
                items.append("Jeweled Gauntlet")
            else:
                items.append("Titan's Resolve")
                items.append("Sterak's Gage")
            return items

        return ["Hand of Justice", "Guinsoo's Rageblade", "Warmog's Armor"]

    def determine_econ_strategy(self, gold, level, stage):
        if gold < 10:
            return "SAVE", "Build interest milestones."
        
        if stage == "2-1" and level < 4:
            return "LEVEL_UP", "Level to 4."
        elif stage == "2-5" and level < 5:
            return "LEVEL_UP", "Level to 5."
        elif stage == "3-2" and level < 6:
            return "LEVEL_UP", "Level to 6."
        elif stage == "4-1" and level < 7:
            return "LEVEL_UP", "Level to 7."
        
        if gold >= 50:
            if level >= 8:
                return "LEVEL_UP", "Invest excess gold to push for Level 9."
            else:
                return "SLOW_ROLL", "Roll or buy XP strictly using interest above 50g."
        
        return "SAVE", "Accumulate gold."

    def calculate_combat_power(self, api_name, star_level):
        champ = self.champions.get(api_name)
        if not champ:
            return 0.0
        cost = int(champ.get("cost", 1))
        return float(cost * (1.8 ** (star_level - 1)))

    def generate_custom_synergy_pathway(self, trait_api_name, current_board, current_bench, active_traits, level):
        """
        Procedural Team Comp Builder: Scrapes active traits to create custom flexible comps.
        Now selects up to 3 carries and 2 tanks.
        """
        trait_champs = [
            api_name for api_name, data in self.champions.items() 
            if trait_api_name in data.get("traits", [])
        ]
        
        if len(trait_champs) == 0:
            return None

        sorted_champs = sorted(trait_champs, key=lambda c: int(self.champions[c].get("cost", 1)), reverse=True)
        
        carries = []
        for champ in sorted_champs:
            role = self.champions[champ].get("role", "")
            if role in ["ADCarry", "APCaster", "ADSpecialist", "APReaper", "ADReaper"]:
                carries.append(champ)
        
        tanks = []
        for champ in sorted_champs:
            role = self.champions[champ].get("role", "")
            if role in ["APTank", "ADTank", "HFighter", "ADFighter"]:
                tanks.append(champ)

        # Defaults if arrays are empty
        if not carries:
            carries = sorted_champs[:2]
        if not tanks:
            tanks = sorted_champs[-1:]

        trait_data = self.traits.get(trait_api_name, {})
        trait_display_name = trait_data.get("name", trait_api_name)
        
        return {
            "id": f"procedural_{trait_api_name}",
            "name": f"Vertical {trait_display_name} Focus",
            "tier": "Flex",
            "base_win_rate": 0.50,
            "core_units": trait_champs,
            "carries": carries[:3],  # Up to 3 carries
            "tanks": tanks[:2],      # Up to 2 tanks
            "flex_units": []
        }

    def analyze_board(self, current_board, current_bench, opponent_boards, shop_units=None, gold=30, level=6, stage="3-2"):
        normalized_board = [{"apiName": u["apiName"], "starLevel": u["starLevel"]} if isinstance(u, dict) else {"apiName": u, "starLevel": 1} for u in current_board]
        normalized_bench = [{"apiName": u["apiName"], "starLevel": u["starLevel"]} if isinstance(u, dict) else {"apiName": u, "starLevel": 1} for u in current_bench]

        active_traits = {}
        for unit in normalized_board:
            champ_data = self.champions.get(unit["apiName"])
            if champ_data:
                for trait in champ_data.get("traits", []):
                    active_traits[trait] = active_traits.get(trait, 0) + 1

        contested_pool = {}
        for enemy in opponent_boards:
            for unit in enemy.get("board", []):
                api_name = unit["apiName"] if isinstance(unit, dict) else unit
                contested_pool[api_name] = contested_pool.get(api_name, 0) + 1

        econ_action, econ_reason = self.determine_econ_strategy(gold, level, stage)
        
        board_names_set = {u["apiName"] for u in normalized_board}
        bench_names_set = {u["apiName"] for u in normalized_bench}

        # Dynamic AI Logs Generation
        ai_thinking_logs = [
            "[AI System] Initializing Board Evaluator...",
            f"[AI System] Board contains {len(normalized_board)} active slots. Level {level} limit matched."
        ]

        # Find "Deadweight" units currently active on the board (not part of the main comp core)
        def find_deadweight_units(board, core_units):
            return [u for u in board if u["apiName"] not in core_units]

        # ----------------------------------------------------
        # PROCESSOR A: HIGH-ELO META COMPILER
        # ----------------------------------------------------
        meta_recommendations = []
        for comp in self.meta.get("meta_compositions", []):
            core_units = comp.get("core_units", [])
            core_set = set(core_units)
            
            owned_core_board = board_names_set.intersection(core_set)
            owned_core_bench = bench_names_set.intersection(core_set)
            total_owned = len(owned_core_board) + len(owned_core_bench)

            # Strict Filtering Rule: Skip if player has zero representation
            if total_owned == 0:
                continue

            contested_count = sum(contested_pool.get(unit, 0) for unit in core_units)
            weighted_owned = (len(owned_core_board) * 1.5) + (len(owned_core_bench) * 1.0)
            max_possible_weight = len(core_set) * 1.5
            base_score = (weighted_owned / max_possible_weight) if max_possible_weight > 0 else 0
            contestation_penalty = (contested_count * 0.04)
            final_fit_score = max(0.0, base_score - contestation_penalty)

            # Evaluate transitions (Empty slot aware)
            bench_to_board = []
            deadweight_board_units = [u for u in normalized_board if u["apiName"] not in core_set]
            available_core_bench = [u for u in normalized_bench if u["apiName"] in core_set]
            virtual_board_count = len(normalized_board)

            for bench_unit in available_core_bench:
                if virtual_board_count < level:
                    bench_to_board.append({
                        "action": "PLACE",
                        "unit": bench_unit["apiName"],
                        "reason": f"Place core unit on board in open slot (Capacity: {virtual_board_count}/{level})."
                    })
                    virtual_board_count += 1
                    continue

                bench_power = self.calculate_combat_power(bench_unit["apiName"], bench_unit["starLevel"])
                
                synergy_bonus = 0.0
                champ_data = self.champions.get(bench_unit["apiName"])
                if champ_data:
                    for trait in champ_data.get("traits", []):
                        current_count = active_traits.get(trait, 0)
                        if current_count in [1, 2, 4, 5, 7]:
                            synergy_bonus += 2.0  
                
                if len(deadweight_board_units) > 0:
                    board_unit = deadweight_board_units[0]
                    board_power = self.calculate_combat_power(board_unit["apiName"], board_unit["starLevel"])
                    
                    if (bench_power + synergy_bonus) >= board_power:
                        bench_to_board.append({
                            "action": "REPLACE",
                            "unit": bench_unit["apiName"],
                            "reason": f"Replace {board_unit['apiName'].replace('TFT17_', '')} ({board_unit['starLevel']}★) with {bench_unit['apiName'].replace('TFT17_', '')}."
                        })
                        deadweight_board_units.pop(0)
                        ai_thinking_logs.append(f"[Combat Evaluator] Swap Suggestion: Core {bench_unit['apiName'].replace('TFT17_', '')} outweighs non-comp {board_unit['apiName'].replace('TFT17_', '')}.")
                    else:
                        bench_to_board.append({
                            "action": "HOLD_BENCH",
                            "unit": bench_unit["apiName"],
                            "reason": f"Keep {board_unit['apiName'].replace('TFT17_', '')} ({board_unit['starLevel']}★) for tempo. Upgrade {bench_unit['apiName'].replace('TFT17_', '')} before swapping."
                        })
                else:
                    bench_to_board.append({
                        "action": "HOLD_BENCH",
                        "unit": bench_unit["apiName"],
                        "reason": "Keep on bench. Board is fully optimized."
                    })

            shop_swaps = []
            if shop_units and len(deadweight_board_units) > 0:
                for shop_raw_name in shop_units:
                    shop_api_name = self.translate_to_api_name(shop_raw_name)
                    if shop_api_name in core_set and shop_api_name not in board_names_set:
                        target_to_replace = deadweight_board_units[0]
                        board_power = self.calculate_combat_power(target_to_replace["apiName"], target_to_replace["starLevel"])
                        shop_power = self.calculate_combat_power(shop_api_name, 1)
                        
                        if shop_power >= board_power:
                            shop_swaps.append({
                                "buy_unit": shop_api_name,
                                "replace_unit": target_to_replace["apiName"],
                                "reason": f"Replace non-comp {target_to_replace['apiName'].replace('TFT17_', '')} on board."
                            })
                            deadweight_board_units.pop(0)
                        if len(deadweight_board_units) == 0:
                            break

            meta_recommendations.append({
                "comp_id": comp.get("id") or comp.get("comp_id"),
                "name": comp.get("name"),
                "tier": comp.get("tier"),
                "fit_score": round(final_fit_score, 3),
                "dynamic_win_rate": round(comp.get("base_win_rate", 0.50) - (contestation_penalty * 0.02), 3),
                "contested_count": contested_count,
                "core_units": core_units,
                "missing_core": list(core_set - board_names_set - bench_names_set),
                "bench_to_board": bench_to_board,
                "shop_swaps": shop_swaps,
                "items": {
                    u: self.calculate_optimal_items(u) for u in comp.get("carries", []) + comp.get("tanks", [])
                },
                "carries": comp.get("carries", []),
                "tanks": comp.get("tanks", [])
            })

        meta_recommendations.sort(key=lambda x: x["fit_score"], reverse=True)

        # ----------------------------------------------------
        # PROCESSOR B: PROCEDURAL SYNERGY ENGINE
        # ----------------------------------------------------
        procedural_recommendations = []
        for trait_api_name, active_count in active_traits.items():
            procedural_profile = self.generate_custom_synergy_pathway(
                trait_api_name, board_names_set, bench_names_set, active_traits, level
            )
            
            if not procedural_profile:
                continue

            core_units = procedural_profile["core_units"]
            core_set = set(core_units)
            owned_core_board = board_names_set.intersection(core_set)
            owned_core_bench = bench_names_set.intersection(core_set)

            # Fit evaluation
            weighted_owned = (len(owned_core_board) * 1.5) + (len(owned_core_bench) * 1.0)
            max_possible_weight = len(core_set) * 1.5
            base_score = (weighted_owned / max_possible_weight) if max_possible_weight > 0 else 0
            
            # Evaluate transitions (Empty slot aware)
            bench_to_board = []
            deadweight_board_units = find_deadweight_units(normalized_board, core_set)
            available_core_bench = [u for u in normalized_bench if u["apiName"] in core_set]
            virtual_board_count = len(normalized_board)

            for bench_unit in available_core_bench:
                if virtual_board_count < level:
                    bench_to_board.append({
                        "action": "PLACE",
                        "unit": bench_unit["apiName"],
                        "reason": f"Place core unit on board in open slot (Capacity: {virtual_board_count}/{level})."
                    })
                    virtual_board_count += 1
                    continue

                bench_power = self.calculate_combat_power(bench_unit["apiName"], bench_unit["starLevel"])
                
                synergy_bonus = 0.0
                champ_data = self.champions.get(bench_unit["apiName"])
                if champ_data:
                    for trait in champ_data.get("traits", []):
                        current_count = active_traits.get(trait, 0)
                        if current_count in [1, 2, 4, 5, 7]:
                            synergy_bonus += 2.0  
                
                if len(deadweight_board_units) > 0:
                    board_unit = deadweight_board_units[0]
                    board_power = self.calculate_combat_power(board_unit["apiName"], board_unit["starLevel"])
                    
                    if (bench_power + synergy_bonus) >= board_power:
                        bench_to_board.append({
                            "action": "REPLACE",
                            "unit": bench_unit["apiName"],
                            "reason": f"Replace {board_unit['apiName'].replace('TFT17_', '')} ({board_unit['starLevel']}★) with {bench_unit['apiName'].replace('TFT17_', '')}."
                        })
                        deadweight_board_units.pop(0)
                    else:
                        bench_to_board.append({
                            "action": "HOLD_BENCH",
                            "unit": bench_unit["apiName"],
                            "reason": f"Keep {board_unit['apiName'].replace('TFT17_', '')} ({board_unit['starLevel']}★) for tempo. Upgrade {bench_unit['apiName'].replace('TFT17_', '')} before swapping."
                        })
                else:
                    bench_to_board.append({
                        "action": "HOLD_BENCH",
                        "unit": bench_unit["apiName"],
                        "reason": "Keep on bench. Board is fully optimized."
                    })

            procedural_recommendations.append({
                "comp_id": procedural_profile["id"],
                "name": procedural_profile["name"],
                "tier": "Flex",
                "fit_score": round(base_score, 3),
                "dynamic_win_rate": 0.50,
                "contested_count": 0,
                "core_units": core_units,
                "missing_core": list(core_set - board_names_set - bench_names_set),
                "bench_to_board": bench_to_board,
                "shop_swaps": [],
                "items": {
                    u: self.calculate_optimal_items(u) for u in procedural_profile.get("carries", []) + procedural_profile.get("tanks", [])
                },
                "carries": procedural_profile.get("carries", []),
                "tanks": procedural_profile.get("tanks", [])
            })

        procedural_recommendations.sort(key=lambda x: x["fit_score"], reverse=True)

        # Append economic logic notes
        ai_thinking_logs.append(f"[Econ Core] Suggestion Strategy: {econ_action} - Reason: {econ_reason}")
        if len(active_traits) > 0:
            highest_active_trait = max(active_traits, key=active_traits.get)
            ai_thinking_logs.append(f"[Synergy Core] Strongest synergy detected: {highest_active_trait.replace('TFT17_', '')} ({active_traits[highest_active_trait]} Units). Updating boards.")

        return {
            "active_traits": active_traits,
            "recommended_comps": meta_recommendations,
            "custom_synergy_comps": procedural_recommendations,
            "economy": {
                "action": econ_action,
                "reason": econ_reason
            },
            "ai_logs": ai_thinking_logs  # <-- ADDED
        }