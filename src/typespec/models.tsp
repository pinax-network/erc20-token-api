/**
 * Common models used for protobuf and openapi3 outputs
 */
namespace Models {
    // Use a generic to allow the model to represent a timestamp using different types for protobuf/openapi3
    model BlockInfo<TimestampType> {
        block_num: uint64;
        timestamp: TimestampType;
    }

    model CommonERC20<TimestampType> {
        ...BlockInfo<TimestampType>;
        trx_id: string;
    }

    model Transfer<TimestampType> {
        contract: string;
        from: string;
        to: string;
        value: string;
        ...CommonERC20<TimestampType>;
        action_index: uint32;
    }

    model BalanceChange<TimestampType> {
         contract: string;
         owner: string;
         amount: string;
         old_balance: string;
         new_balance: string;
         change_type: int32;
        ...CommonERC20<TimestampType>;
    }

    model Supply<TimestampType> {
        contract: string;
        supply: string;
        ...BlockInfo<TimestampType>;
    }

    model Contract<TimestampType>{
        contract: string;
        name: string;
        symbol: string;
        decimals: int64;
        ...BlockInfo<TimestampType>;
    }
}
