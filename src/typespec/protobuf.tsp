import "@typespec/protobuf";
import "./models.tsp";

using TypeSpec.Protobuf;

@package({
    name: "erc20.token.v1",
})
namespace ERC20TokensV1;

// `is` or `extends` syntax doesn't work here, see https://github.com/microsoft/typespec/issues/3266
model Supply {
    ...Models.Supply<WellKnown.Timestamp>;
}
@@field(Supply.block_num, 1);
@@field(Supply.timestamp, 2);
@@field(Supply.contract, 3);
@@field(Supply.supply, 4);

model Contract {
    ...Models.Contract<WellKnown.Timestamp>;
}
@@field(Contract.contract, 1);
@@field(Contract.name, 2);
@@field(Contract.symbol, 3);
@@field(Contract.decimals, 4);
@@field(Contract.block_num, 5);
@@field(Contract.timestamp, 6);

model Transfer {
    ...Models.Transfer<WellKnown.Timestamp>;
}
@@field(Transfer.contract, 1);
@@field(Transfer.from, 2);
@@field(Transfer.to, 3);
@@field(Transfer.value, 4);
@@field(Transfer.tx_id, 5);
@@field(Transfer.block_num, 6);
@@field(Transfer.timestamp, 7);

model BalanceChange {
    ...Models.BalanceChange<WellKnown.Timestamp>;
}
@@field(BalanceChange.block_num, 1);
@@field(BalanceChange.timestamp, 2);
@@field(BalanceChange.contract, 3);
@@field(BalanceChange.owner, 4);
@@field(BalanceChange.amount, 5);
@@field(BalanceChange.old_balance, 6);
@@field(BalanceChange.new_balance, 7);
@@field(BalanceChange.tx_id, 8);
@@field(BalanceChange.change_type, 9);

