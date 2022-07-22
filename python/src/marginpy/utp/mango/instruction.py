import marginpy.generated_client.instructions as gen_ix

# --- Activate

class ActivateArgs(gen_ix.UtpMangoActivateArgs):
    pass

def make_activate_ix():
    # utp_mango_activate.py
    pass

# --- Deactivate

class DeactivateArgs(gen_ix.DeactivateUtpArgs):
    pass

def make_deactivate_ix():
    # deactivate_utp.py
    pass

# --- Deposit

class DepositArgs(gen_ix.UtpMangoDepositArgs):
    pass

def make_deposit_ix():
    # utp_mango_deposit.py
    pass

# --- Withdraw

class WithdrawArgs(gen_ix.UtpMangoWithdrawArgs):
    pass

def make_withdraw_ix():
    # utp_mango_withdraw.py
    pass

# --- Place order

class PlacePerpOrderArgs(gen_ix.UtpMangoUsePlacePerpOrderArgs):
    pass

def make_place_perp_order_ix():
    # utp_mango_use_place_perp_order.py
    pass

# --- Cancel order

class CancelPerpOrderArgs(gen_ix.UtpMangoUseCancelPerpOrderArgs):
    pass

def make_cancel_perp_order_ix():
    # utp_mango_use_cancel_perp_order.py
    pass
